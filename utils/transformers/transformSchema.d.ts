// TODO: remove if this file is converted to TypeScript
type Transformer = (document: Record<string, any>) => void;

export declare const v4Transformers: Transformer[];
export declare const v4SchemaForSdksTransformers: Transformer[];
export declare const v4SchemaForSdksNormalizedTransformers: Transformer[];
export declare const readmeApiExplorerTransformers: Transformer[];
export declare const relatedVisitorsApiTransformers: Transformer[];
export declare const removeExtraDocumentationTransformers: Transformer[];
export declare const schemaForSdksTransformers: Transformer[];
export declare function transformSchema(content: string, transformers?: Transformer[]): string;
