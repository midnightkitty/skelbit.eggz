var socket;
var dc2;



$(document).keypress(function(e) {
  console.log('key pressed:' + e.keyCode);
  if (e.keyCode == 49) {
    // console.log('sending websocket message');
    socket.emit('msg','test websocket message from client');
  }
  if (e.keyCode == 50) {
    // console.log('sending dataChannel message');
    dc2.send('test dataChannel message from client');
  }
});


$(document).ready(function() {

  socket = io();

  socket.on('connect', function(data){
    console.log('connected to server web socket');
    // socket.emit('msg','client browser: sup server?');
  });

  socket.on('msg', function(data) {
      // console.log('msg received form server');
      console.log(data);
  });

socket.on('wrtc_offer', function(data) {
    // console.log('wrtc offer received from Server yah!');
    // console.log(data);
    desc = JSON.parse(data);
    set_pc2_remote_description(desc);
});

socket.on('candidate', function(data) {
  // console.log('ICE candidate received from server!');

  var candidate = new RTCIceCandidate(JSON.parse(data));
  if (candidate)
    pc2.addIceCandidate(candidate, handleAddIceCandidateSuccess, handleAddIceCandidateError);
});

socket.on('player_list', function(data) {
  // console.log('connected clients: ' + data);
});

var pc2 = new RTCPeerConnection(
  {
    iceServers: [{url:'stun:stun.l.google.com:19302'}]
  },
  {
    'optional': []
  }
);


  pc2.onicecandidate = function(candidate) {
    //  console.log(JSON.stringify(candidate.candidate));
    // console.log('sending ICE candidate to server');
    socket.emit('candidate', JSON.stringify(candidate.candidate));

    if(!candidate.candidate) return;
    //  pc1.addIceCandidate(candidate.candidate);
  }
  pc2.onsignalingstatechange = function(event) {
    // console.info("signaling state change: ", event.target.signalingState);
  }
  pc2.oniceconnectionstatechange = function(event) {
   //  console.info("ice connection state change: ", event.target.iceConnectionState);
  }
  pc2.onicegatheringstatechange = function(event) {
    // console.info("ice gathering state change: ", event.target.iceGatheringState);
  }

  function handleAddIceCandidateSuccess() {
   // console.log('add ice succeeded');
  }
    
  function handleAddIceCandidateError() {
    // console.log('add ice error');
  }  


  function handle_error(error) {
    throw error;
  }

  var checks = 0;
  var expected = 10;


  function create_data_channels() {



    pc2.ondatachannel = function(event) {
      dc2 = event.channel;
      dc2.onopen = function() {
        console.log(" data channel open wither server");
        dc2.onmessage = function(event) {
          var data = event.data;
          console.log("dc2: received '"+data+"'");
        }
      };
    }
  }

  function set_pc2_remote_description(desc) {
   // console.log('pc2: set remote description');
    pc2.setRemoteDescription(
      new RTCSessionDescription(desc),
      create_answer,
      handle_error
    );
  }

  function create_answer() {
   // console.log('pc2: create answer');
    pc2.createAnswer(
      set_pc2_local_description,
      handle_error
    );
  }

  function set_pc2_local_description(desc) {
    // console.log('pc2: set local description');
    // console.log(JSON.stringify(desc));

    pc2.setLocalDescription(
      new RTCSessionDescription(desc),
      set_pc1.bind(undefined, desc),
      handle_error
    )
  }

  function set_pc1(desc) {
      console.log('Sending server wrtc answer');
      socket.emit('wrtc_answer', JSON.stringify(desc));
  }

  function wait() {
    console.log('waiting');
  }

  function run() {
    create_data_channels();
  }

  function done() {
//    console.log('cleanup');
//    pc2.close();
//     console.log('done');
  }

  run();

  setupPhaser();
});

var game;
var platforms;
var player;
var cursors;

function setupPhaser() {
  game = new Phaser.Game(800, 600, Phaser.AUTO, '', { preload: preload, create: create, update: update });



  function preload() {
    game.load.image('sky', 'assets/sky.png');
    game.load.image('ground', 'assets/platform.png');
    game.load.image('star', 'assets/star.png');
    game.load.spritesheet('dude', 'assets/dude.png', 32, 48);    
}



function create() {

    //  We're going to be using physics, so enable the Arcade Physics system
    game.physics.startSystem(Phaser.Physics.ARCADE);

    //  A simple background for our game
    game.add.sprite(0, 0, 'sky');

    //  The platforms group contains the ground and the 2 ledges we can jump on
    platforms = game.add.group();

    //  We will enable physics for any object that is created in this group
    platforms.enableBody = true;

    // Here we create the ground.
    var ground = platforms.create(0, game.world.height - 64, 'ground');

    //  Scale it to fit the width of the game (the original sprite is 400x32 in size)
    ground.scale.setTo(2, 2);

    //  This stops it from falling away when you jump on it
    ground.body.immovable = true;

    //  Now let's create two ledges
    var ledge = platforms.create(400, 400, 'ground');

    ledge.body.immovable = true;

    ledge = platforms.create(-150, 250, 'ground');

    ledge.body.immovable = true;

    // The player and its settings
    player = game.add.sprite(32, game.world.height - 150, 'dude');

    //  We need to enable physics on the player
    game.physics.arcade.enable(player);

    //  Player physics properties. Give the little guy a slight bounce.
    player.body.bounce.y = 0.2;
    player.body.gravity.y = 300;
    player.body.collideWorldBounds = true;

    //  Our two animations, walking left and right.
    player.animations.add('left', [0, 1, 2, 3], 10, true);
    player.animations.add('right', [5, 6, 7, 8], 10, true);

    //  Our controls.
    cursors = game.input.keyboard.createCursorKeys();

    //game.scale.setGameSize(window.innerWidth, window.innerHeight);
    game.scale.setGameSize(800,600);

    game.scale.refresh();
}

$(window).resize(function() {
  //game.scale.setGameSize(window.innerWidth, window.innerHeight)
})

function update() {
    
    //  Collide the player and the stars with the platforms
    var hitPlatform = game.physics.arcade.collide(player, platforms);

    //  Reset the players velocity (movement)
    player.body.velocity.x = 0;
    
    if (cursors.left.isDown)
    {
        //  Move to the left
        player.body.velocity.x = -150;

        player.animations.play('left');
    }
    else if (cursors.right.isDown)
    {
        //  Move to the right
        player.body.velocity.x = 150;

        player.animations.play('right');
    }
    else
    {
        //  Stand still
        player.animations.stop();

        player.frame = 4;
    }
    
    //  Allow the player to jump if they are touching the ground.
    if (cursors.up.isDown && player.body.touching.down)
    {
        player.body.velocity.y = -350;
    }

    
}




}