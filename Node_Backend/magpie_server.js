
const express = require('express'),
path = require('path'),
passport = require('passport'),
bodyParser = require('body-parser'),
cors = require('cors'),
mongoose = require('mongoose'),
session      = require('express-session'),
flash    = require('connect-flash'),
CONFIG = require('./config/web-config'),
LocalStrategy = require('passport-local').Strategy,
RedisStore = require('connect-redis')(session);
const http = require('http');
var https = require('https');
//const forceSsl = require('force-ssl-heroku');
//var compression = require('compression');
var expressStaticGzip = require('express-static-gzip');
const fs = require('fs');
//var dash = require('appmetrics-dash');
require('./packages/redis/subscriber');



magpieAdminRoutes  = require('./system/nodex/admin/sectionRoutes');

customPmsRoutes = require('./nodex/admin/customPmsRoutes');
magpieCustomRoutes = require('./system/nodex/admin/customRoutes');
magpieApiRoutes  = require('./system/nodex/api/apiRoutes');
adminCustomRoutes  = require('./nodex/admin/customRoutes');
apiCustomRoutes  = require('./nodex/api/apiRoutes');
subSectionRoute =require('./nodex/Subroutes/subSectionRoutes');
mongoose.Promise = global.Promise;
mongoose.connect(CONFIG.db.DB_PATH,{ keepAlive:true,
  useCreateIndex:true,
  useFindAndModify:false,
  useNewUrlParser: true 
 }).then(
    () => {console.log('Database is connected') },
    err => { console.log('Can not connect to the database'+ err)}
  );

const app = express();
app.use(bodyParser.urlencoded());
app.use(bodyParser.json());
app.use(cors());
// app.use(cors({  
//   origin: ["http://localhost:4000"],
//   methods: ["GET", "POST"],
//   allowedHeaders: ["Content-Type", "Authorization"]
// }));
// const port = process.env.PORT || 4000;
console.log(process.env.NODE_APP_STAGE);
const port = process.env.PORT || CONFIG.app.PORT;
//app.use(compression());





// app.use(express.static(path.join(__dirname, 'dist')));
// app.use('/', expressStaticGzip(__dirname+'/'+CONFIG.app.BUILD_PATH, {
//   enableBrotli: true, 
//   orderPreference: ['br','gzip','deflate']
// }));

app.use(passport.initialize());
app.use(passport.session());


app.use(session({ secret: 'keyboard cat', resave: false, saveUninitialized: true, }));


app.use(flash());


app.use('/uploads', express.static('uploads'))

const adminFolder = './nodex/admin/';
const admin_routes = require('fs');
admin_routes.readdirSync(adminFolder).forEach(file => {

  var route_path = file.split("Routes.js")[0];
  var route_file = file.split(".js")[0];
  route = require('./nodex/admin/'+route_file);
  app.use('/admin/'+route_path, route);
})

app.use('/admin/admin_custom', adminCustomRoutes);
app.use('/admin/admin_custom', customPmsRoutes);
app.use('/admin/magpie_custom', magpieCustomRoutes);
app.use('/admin/subsecton',subSectionRoute);
app.use('/admin/:section', magpieAdminRoutes);
app.use('/api/:section', apiCustomRoutes);
app.use('/api/:section', magpieApiRoutes);





// app.get('/*', (req, res) => {
//   res.sendFile(path.join(__dirname+'/'+CONFIG.app.BUILD_PATH, '/index.html'));
// });
const httpServer = http.createServer(app);
var io = require('socket.io')(httpServer);
app.set('socketio', io);

io.sockets.on('connection', function (client) {

  client.on('join', (data) => {        
    client.join(data.room);
    console.log(client.id + " is connected.");  
  });

  client.on('createItem', (data) => {
      client.broadcast.in(data.room).emit('new item', {message:'New '+data.module+' is created.'});
  });
  client.on('updateItem', (data) => {

  
      client.broadcast.in(data.room).emit('update item',  {message:'A '+data.module+' is  updated.'});
  });
  client.on('deleteItem', (data) => {
    client.broadcast.in(data.room).emit('delete item',  {message:'A '+data.module+' is deleted.'});
  });
  client.on('changeItemStatus', (data) => {
    client.broadcast.in(data.room).emit('change status item',  {message:'A '+data.module+' is  deleted.'});
  });


 
});




//dash.monitor({server: httpServer});

httpServer.listen(port, function(){
    console.log('Listening on port ' + port);
});



  
