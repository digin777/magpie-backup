let dev = {
  app: {
    PORT: 4000,
    API_PORT: 4001,
    BUILD_PATH:"bldfiles_dev"
  }
};
let prod = {
  app: {
    PORT: "{port1}",
    API_PORT: "{port2}",
    BUILD_PATH:"bldfiles_prod"
  }
};
let staging = {
  app: {
    PORT: "{port1}",
    API_PORT: 4040,
    BUILD_PATH:"bldfiles_staging"
  }
};

let config = "";
switch (process.env.NODE_APP_STAGE) {
  case 'production':
    config = prod;
    break;
  case 'development':
    config = dev;
    break;
  case 'staging':
    config = staging;
    break;
  default:
    config = dev;

}


module.exports = {
  ...config
};
