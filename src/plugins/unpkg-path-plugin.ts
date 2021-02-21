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
          const URLObj = new URL(args.path, `${args.importer}/`);
          return {
            namespace: 'a',
            path: URLObj.href,
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
              import message from 'medium-test-pkg';
              console.log(message);
            `,
          };
        } 

        const { data } = await axios.get(args.path);
        return {
          loader: 'jsx',
          contents: data,
        }

      });
    },
  };
};