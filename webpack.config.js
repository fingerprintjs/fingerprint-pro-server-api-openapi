import * as path from 'path';
import { fileURLToPath } from 'url';
import webpack from 'webpack';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import { CleanWebpackPlugin } from 'clean-webpack-plugin';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import 'dotenv/config';
import {
  readmeApiExplorerTransformers,
  removeExtraDocumentationTransformers,
  schemaForSdksTransformers,
  transformSchema,
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
          from: 'schemas',
          to: 'schemas',
          transform: (content) => transformSchema(content),
        },
        {
          from: 'schemas',
          to: 'schemes', // backward compatibility
          transform: (content) => transformSchema(content),
        },
        {
          from: 'schemas/fingerprint-server-api.yaml',
          to: 'schemas/fingerprint-server-api-readme-explorer.yaml',
          transform: (content) => transformSchema(content, readmeApiExplorerTransformers),
        },
        {
          from: 'schemas/fingerprint-server-api.yaml',
          to: 'schemas/fingerprint-server-api-compact.yaml',
          transform: (content) => transformSchema(content, removeExtraDocumentationTransformers),
        },
        {
          from: 'schemas/fingerprint-server-api.yaml',
          to: 'schemas/fingerprint-server-api-schema-for-sdks.yaml',
          transform: (content) => transformSchema(content, schemaForSdksTransformers),
        },
        {
          from: 'examples',
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
