// Recovery System

(function(window) {
    'use strict';

    class Recovery {
        async init() {
            // Check for emergency recovery
            const needsRecovery = Storage.getLocal('system_crashed', false);

            if (needsRecovery) {
                Logger.warn('Recovery', 'System crash detected, initiating recovery');
                await this.recover();
            }
        }

        async recover() {
            try {
                // First attempt: boot from embedded PNG snapshot
                let snapshot = null;
                if (window.PNGBoot) {
                    snapshot = await PNGBoot.extract('boot.png');
                    if (snapshot) Logger.info('Recovery', 'Recovered from PNG boot image');
                }

                // Fallback: load from Storage
                if (!snapshot) {
                    snapshot = await Snapshot.load();
                }

                if (snapshot) {
                    await Snapshot.restore(snapshot);
                    Logger.info('Recovery', 'System recovered from snapshot');
                }

                Storage.setLocal('system_crashed', false);
            } catch (error) {
                Logger.error('Recovery', 'Recovery failed', error);
            }
        }

        markCrashed() {
            Storage.setLocal('system_crashed', true);
        }
    }

    window.Recovery = new Recovery();

})(window);
