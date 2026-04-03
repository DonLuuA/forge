import { Config } from '../types';
export declare class ConfigManager {
    private config;
    constructor();
    getConfig(): Config;
    updateConfig(newConfig: Partial<Config>): void;
    validate(): boolean;
}
//# sourceMappingURL=config.d.ts.map