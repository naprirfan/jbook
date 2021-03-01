import * as esbuild from 'esbuild-wasm';
import axios from 'axios';
import localForage from 'localforage';

const fileCache = localForage.createInstance({
  name: 'filecache',
});


 
export const unpkgPathPlugin = (inputCode: string) => {
  return {
    name: 'unpkg-path-plugin',
    setup(build: esbuild.PluginBuild) {
      // Handle root entry file of index.js
      build.onResolve({ filter: /(^index\.js$)/ }, (args: any) => {
        return { path: 'index.js', namespace: 'a'};
      });

      // Handle relative paths in a module
      build.onResolve({ filter: /(^\.+\/)/ }, (args: any) => {
        const path = new URL(args.path, `https://unpkg.com${args.resolveDir}/`).href;
          
        return {
          namespace: 'a',
          path,
        }
      })

      // Handle main file of a module
      build.onResolve({ filter: /.*/ }, async (args: any) => {
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
            contents: inputCode,
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
