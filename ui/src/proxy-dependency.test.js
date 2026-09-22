const fs = require('fs');
const path = require('path');

describe('development proxy runtime dependency', () => {
  test('installs http-proxy-middleware as a production dependency', () => {
    const packageJsonPath = path.join(__dirname, '../package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    expect(packageJson.dependencies).toHaveProperty('http-proxy-middleware');
    expect(packageJson.devDependencies?.['http-proxy-middleware']).toBeUndefined();
  });

  test('can resolve http-proxy-middleware from setupProxy.js', () => {
    expect(() => require.resolve('http-proxy-middleware')).not.toThrow();
  });

  test('should verify setupProxy.js imports correctly', () => {
    const setupProxyPath = path.join(__dirname, 'setupProxy.js');
    const setupProxyContent = fs.readFileSync(setupProxyPath, 'utf8');
    
    expect(setupProxyContent).toMatch(/http-proxy-middleware/);
  });
});