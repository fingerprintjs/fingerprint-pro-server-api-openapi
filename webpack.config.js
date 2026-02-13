// @ts-check
import * as path from 'path';
import { fileURLToPath } from 'url';
import webpack from 'webpack';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import { CleanWebpackPlugin } from 'clean-webpack-plugin';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import 'dotenv/config';
import {
  readmeApiExplorerTransformers,
  relatedVisitorsApiTransformers,
  removeExtraDocumentationTransformers,
  schemaForSdksTransformers,
  v4Transformers,
  v4SchemaForSdksTransformers,
  transformSchema,
  v4SchemaForSdksNormalizedTransformers,
} from './utils/transformers/transformSchema.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const outputPath = path.resolve(__dirname, 'dist');

export default {
  mode: 'development',
  entry: {
    app: './src/index.ts',
  },
  resolve: {
    extensions: ['.ts', '.js'],
    fallback: { buffer: false },
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.yaml$/,
        use: [
          // { loader: 'json-loader' },
          { loader: 'yaml-loader' },
        ],
      },
      {
        test: /\.css$/,
        use: [{ loader: 'style-loader' }, { loader: 'css-loader' }],
      },
    ],
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.PRIVATE_KEY': JSON.stringify(process.env.PRIVATE_KEY),
    }),
    new CleanWebpackPlugin({
      cleanOnceBeforeBuildPatterns: [outputPath],
    }),
    new HtmlWebpackPlugin({
      template: 'src/index.html',
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: 'schemas/fingerprint-server-api-v4.yaml',
          // full schema used by docs.fingerprint.com, and other cases where examples are useful
          // includes examples same as the source schema
          // includes `oneOf` operators same as the source schema
          // includes additionalProperties: false same as the source schema
          to: 'schemas/fingerprint-server-api-v4-with-examples.yaml',
          transform: (content) => transformSchema(content, v4Transformers),
        },
        {
          from: 'schemas/fingerprint-server-api-v4.yaml',
          // just schema used by most SDKs
          // examples are removed
          // includes `oneOf` operators same as the source schema
          // additionalProperties: false are removed for backward compatibility
          to: 'schemas/fingerprint-server-api-v4.yaml',
          transform: (content) => transformSchema(content, v4SchemaForSdksTransformers),
        },
        {
          from: 'schemas/fingerprint-server-api-v4.yaml',
          // normalized schema used by SDKs in weakly typed languages
          // examples are removed
          // `oneOf` operators and similar are resolved
          // additionalProperties: false are removed for backward compatibility
          to: 'schemas/fingerprint-server-api-v4-normalized.yaml',
          transform: (content) => transformSchema(content, v4SchemaForSdksNormalizedTransformers),
        },
        {
          from: 'schemas/fingerprint-server-api-for-sdks.yaml',
          to: 'schemas/fingerprint-server-api.yaml',
          transform: (content) => transformSchema(content),
        },
        {
          from: 'schemas/fingerprint-related-visitors-api-readme-explorer.yaml',
          to: 'schemas/fingerprint-related-visitors-api-readme-explorer.yaml',
          transform: (content) => transformSchema(content, relatedVisitorsApiTransformers),
        },
        {
          from: 'schemas/fingerprint-server-api-readme-explorer.yaml',
          to: 'schemas/fingerprint-server-api-readme-explorer.yaml',
          transform: (content) => transformSchema(content, readmeApiExplorerTransformers),
        },
        {
          from: 'schemas/fingerprint-server-api-for-sdks.yaml',
          to: 'schemas/fingerprint-server-api-compact.yaml',
          transform: (content) => transformSchema(content, removeExtraDocumentationTransformers),
        },
        {
          from: 'schemas/fingerprint-server-api-for-sdks.yaml',
          to: 'schemas/fingerprint-server-api-schema-for-sdks.yaml',
          transform: (content) => transformSchema(content, schemaForSdksTransformers),
        },
        {
          from: 'schemas/paths/examples',
          to: 'examples',
        },
        {
          from: 'res/favicon.ico',
        },
      ],
    }),
  ],
  output: {
    filename: '[name].bundle.js',
    path: outputPath,
  },
};
