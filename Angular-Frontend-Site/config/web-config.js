let dev = {
  app: {
    PORT: 3000,
  }
};
let prod = {
  app: {
    PORT: "{port1}",
  }
};
let staging = {
  app: {
    PORT: 3001,
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
