// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses `environment.ts`, but if you do
// `ng build --env=prod` then `environment.prod.ts` will be used instead.
// The list of which env maps to which file can be found in `.angular-cli.json`.

export const environment = {
  production: false,
  server_url : "http://localhost:4001/admin/",
  upload_url : "http://localhost:4001/",
  site_server_url : "http://localhost:4001/site/",
  site_url: "http://localhost:4200/",
  socket_url:"http://localhost:4001/",
  loading_image:"http://localhost:4200/assets/themes/admin/default/images/loading.gif",
  package_url:'http://magpie-packages.iscripts.com/packages/'

};


