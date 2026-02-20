declare const __APP_VERSION__: string;
declare module "*.grammar" {
    import { LRParser } from "@lezer/lr";
    export const parser: LRParser;
}
