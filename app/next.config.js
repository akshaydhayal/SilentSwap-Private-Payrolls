/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ['@silentswap/sdk', '@silentswap/react'],
  },
  webpack: (config, { isServer, webpack }) => {
    const path = require('path');
    
    // Ignore React Native modules that are not needed in web environment
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      '@react-native-async-storage/async-storage': false,
      'react-native': 'react-native-web',
    };

    // Stub out SilentSwap packages on server-side to avoid top-level await issues
    if (isServer) {
      config.resolve.alias['@silentswap/sdk'] = path.resolve(__dirname, 'webpack-stubs/silentswap-sdk.js');
      config.resolve.alias['@silentswap/react'] = path.resolve(__dirname, 'webpack-stubs/silentswap-react.js');
    }
    
    // For client-side, ensure top-level await is properly supported
    if (!isServer) {
      // Enable top-level await
      config.experiments = {
        ...(config.experiments || {}),
        topLevelAwait: true,
      };
      
      // Mark SilentSwap packages to be loaded as async chunks
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          ...config.optimization.splitChunks,
          chunks: 'all',
          maxAsyncRequests: 30,
          cacheGroups: {
            ...config.optimization.splitChunks?.cacheGroups,
            silentswap: {
              test: /[\\/]node_modules[\\/]@silentswap[\\/]/,
              name: 'silentswap',
              chunks: 'async',
              priority: 20,
              enforce: true,
              reuseExistingChunk: true,
            },
          },
        },
      };
      
      // Increase chunk loading timeout for async chunks
      config.output = {
        ...config.output,
        chunkLoadTimeout: 120000, // 120 seconds for modules with top-level await
      };
    }
    
    // Fallback for Node.js modules
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: false,
      stream: false,
      url: false,
      zlib: false,
      http: false,
      https: false,
      assert: false,
      os: false,
      path: false,
      buffer: false,
    };

    // Ignore specific problematic modules (React Native async storage)
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /^@react-native-async-storage\/async-storage$/,
      })
    );

    // Ignore @metamask/sdk browser-specific imports that reference React Native
    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(
        /@react-native-async-storage\/async-storage/,
        path.resolve(__dirname, 'webpack-stubs/async-storage.js')
      )
    );

    return config;
  },
};

module.exports = nextConfig;
