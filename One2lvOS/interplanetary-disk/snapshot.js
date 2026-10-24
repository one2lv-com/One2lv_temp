// Snapshot System

(function(window) {
    'use strict';

    class Snapshot {
        async create() {
            const snapshot = {
                version: '1.0.0',
                timestamp: Date.now(),
                registry: await Registry.snapshot(),
                config: Config.toJSON()
            };

            try {
                await Storage.set('snapshots', {
                    id: 'latest',
                    data: snapshot,
                    timestamp: Date.now()
                });

                // Also embed snapshot into a PNG for portable boot recovery
                if (window.PNGBoot) {
                    PNGBoot.embed(snapshot).then(blob => {
                        if (blob) Logger.info('Snapshot', 'PNG boot image written');
                    }).catch(() => {});
                }

                Logger.info('Snapshot', 'Snapshot created');
                return snapshot;
            } catch (error) {
                Logger.error('Snapshot', 'Failed to create snapshot', error);
                throw error;
            }
        }

        async load() {
            try {
                const stored = await Storage.get('snapshots', 'latest');
                if (stored) {
                    Logger.info('Snapshot', 'Snapshot loaded');
                    return stored.data;
                }
            } catch (error) {
                Logger.error('Snapshot', 'Failed to load snapshot', error);
            }
            return null;
        }

        async restore(snapshot) {
            try {
                await Registry.restore(snapshot.registry);
                Logger.info('Snapshot', 'Snapshot restored');
            } catch (error) {
                Logger.error('Snapshot', 'Failed to restore snapshot', error);
                throw error;
            }
        }
    }

    window.Snapshot = new Snapshot();

})(window);
