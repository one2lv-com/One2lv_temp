// PNG Boot System — CRC32 tEXt chunk implementation

(function(window) {
    'use strict';

    const KEYWORD = 'one2lvos-snapshot';

    // ── CRC32 ──────────────────────────────────────────────────────────────────
    const _crcTable = (() => {
        const t = new Uint32Array(256);
        for (let n = 0; n < 256; n++) {
            let c = n;
            for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
            t[n] = c;
        }
        return t;
    })();

    function _crc32(data) {
        let crc = 0xFFFFFFFF;
        for (let i = 0; i < data.length; i++) crc = _crcTable[(crc ^ data[i]) & 0xFF] ^ (crc >>> 8);
        return (crc ^ 0xFFFFFFFF) >>> 0;
    }

    // ── Inject tEXt chunk into PNG bytes ──────────────────────────────────────
    function _injecttEXt(pngBytes, keyword, text) {
        const enc = new TextEncoder();
        const kw  = enc.encode(keyword);
        const tx  = enc.encode(text);
        const data = new Uint8Array(kw.length + 1 + tx.length);
        data.set(kw, 0);
        data[kw.length] = 0x00;
        data.set(tx, kw.length + 1);

        const chunkType = enc.encode('tEXt');
        const crcInput  = new Uint8Array(4 + data.length);
        crcInput.set(chunkType, 0);
        crcInput.set(data, 4);
        const crc = _crc32(crcInput);

        const chunk = new Uint8Array(4 + 4 + data.length + 4);
        const view  = new DataView(chunk.buffer);
        view.setUint32(0, data.length, false);
        chunk.set(chunkType, 4);
        chunk.set(data, 8);
        view.setUint32(8 + data.length, crc, false);

        // Insert after IHDR (8 sig + 4 len + 4 "IHDR" + 13 data + 4 crc = offset 33)
        const out = new Uint8Array(pngBytes.length + chunk.length);
        out.set(pngBytes.slice(0, 33), 0);
        out.set(chunk, 33);
        out.set(pngBytes.slice(33), 33 + chunk.length);
        return out;
    }

    // ── Read tEXt chunk from PNG bytes ────────────────────────────────────────
    function _readtEXt(bytes, keyword) {
        const dec = new TextDecoder();
        let offset = 8; // skip PNG signature
        while (offset < bytes.length - 12) {
            const view   = new DataView(bytes.buffer, bytes.byteOffset + offset);
            const length = view.getUint32(0, false);
            const type   = dec.decode(bytes.slice(offset + 4, offset + 8));
            if (type === 'IEND') break;
            if (type === 'tEXt') {
                const payload = bytes.slice(offset + 8, offset + 8 + length);
                const sep = payload.indexOf(0);
                if (sep !== -1) {
                    const kw = dec.decode(payload.slice(0, sep));
                    if (kw === keyword) return dec.decode(payload.slice(sep + 1));
                }
            }
            offset += 4 + 4 + length + 4;
        }
        return null;
    }

    // ── PNGBoot ───────────────────────────────────────────────────────────────
    class PNGBoot {
        /**
         * Extract a snapshot from a PNG file.
         * @param {string|Blob} source — URL string or Blob
         * @returns {object|null} parsed snapshot or null
         */
        async extract(source) {
            try {
                let arrayBuffer;
                if (typeof source === 'string') {
                    const res = await fetch(source);
                    arrayBuffer = await res.arrayBuffer();
                } else {
                    arrayBuffer = await source.arrayBuffer();
                }
                const bytes = new Uint8Array(arrayBuffer);
                const json  = _readtEXt(bytes, KEYWORD);
                if (!json) {
                    Logger.info('PNGBoot', 'No snapshot tEXt chunk found in PNG');
                    return null;
                }
                const snapshot = JSON.parse(json);
                Logger.info('PNGBoot', 'Snapshot extracted from PNG');
                return snapshot;
            } catch (error) {
                Logger.error('PNGBoot', 'Failed to extract from PNG', error);
                return null;
            }
        }

        /**
         * Embed a snapshot into a PNG (draws a thumbnail, returns Blob).
         * @param {object} snapshot
         * @returns {Blob} PNG blob with embedded snapshot
         */
        async embed(snapshot) {
            try {
                const canvas  = document.createElement('canvas');
                canvas.width  = 480;
                canvas.height = 270;
                const ctx = canvas.getContext('2d');

                // Thumbnail background
                ctx.fillStyle = '#0f172a';
                ctx.fillRect(0, 0, 480, 270);
                ctx.fillStyle = '#1e40af';
                ctx.font = 'bold 18px monospace';
                ctx.fillText('One2lvOS Snapshot', 20, 40);
                ctx.fillStyle = '#64748b';
                ctx.font = '12px monospace';
                ctx.fillText(new Date(snapshot.timestamp).toISOString(), 20, 65);

                // Convert canvas to PNG bytes
                const dataURL   = canvas.toDataURL('image/png');
                const b64       = dataURL.split(',')[1];
                const binary    = atob(b64);
                const raw       = new Uint8Array(binary.length);
                for (let i = 0; i < binary.length; i++) raw[i] = binary.charCodeAt(i);

                // Inject tEXt chunk
                const json    = JSON.stringify(snapshot);
                const patched = _injecttEXt(raw, KEYWORD, json);
                const blob    = new Blob([patched], { type: 'image/png' });
                Logger.info('PNGBoot', 'Snapshot embedded into PNG');
                return blob;
            } catch (error) {
                Logger.error('PNGBoot', 'Failed to embed snapshot into PNG', error);
                return null;
            }
        }
    }

    window.PNGBoot = new PNGBoot();

})(window);
