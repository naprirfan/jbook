import * as esbuild from 'esbuild-wasm';
import axios from 'axios';
import localForage from 'localforage';

const fileCache = localForage.createInstance({
  name: 'filecache',
});


 
export const unpkgPathPlugin = () => {
  return {
    name: 'unpkg-path-plugin',
    setup(build: esbuild.PluginBuild) {
      build.onResolve({ filter: /.*/ }, async (args: any) => {
        console.log('onResolve', args);

        if (args.path === 'index.js') {
          return { path: args.path, namespace: 'a' };
        }

        const isRelativePath = args.path.includes('./') || args.path.includes('../');
        if (isRelativePath) {
          const path = new URL(args.path, `https://unpkg.com${args.resolveDir}/`).href;
          
          return {
            namespace: 'a',
            path,
          }
        }

        return {
          namespace: 'a',
          path: `https://unpkg.com/${args.path}`,
        }
      });
 
      build.onLoad({ filter: /.*/ }, async (args: any) => {
        console.log('onLoad', args);
 
        if (args.path === 'index.js') {
          return {
            loader: 'jsx',
            contents: `
              import React from 'react-select';
              console.log(React);
            `,
          };
        } 

        // Check to see if cache exists
        const cached = await fileCache.getItem<esbuild.OnLoadResult>(args.path);
        if (cached) {
          return cached;
        }

        const { data, request } = await axios.get(args.path);

        const result: esbuild.OnLoadResult = {
          loader: 'jsx',
          contents: data,
          resolveDir: new URL('./', request.responseURL).pathname,
        }

        // Cache path
        await fileCache.setItem(args.path, result);
        return result;
      });
    },
  };
};
