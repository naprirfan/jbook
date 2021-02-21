import * as esbuild from 'esbuild-wasm';
import axios from 'axios';
 
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
              import message from 'nested-test-pkg';
              console.log(message);
            `,
          };
        } 

        const { data, request } = await axios.get(args.path);
        const { responseURL } = request;

        return {
          loader: 'jsx',
          contents: data,
          resolveDir: new URL('./', responseURL).pathname,
        }

      });
    },
  };
};
