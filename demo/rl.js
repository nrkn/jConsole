function rl() {
  var container = document.getElementById( "consoleContainer" );
  jConsole.initializeConsole( container, 18, 18 );
  jConsole.hideCursor();
  
  var viewportRadius = 9;
  var bigNumber = 1000;
  var playerX = 0;
  var playerY = 0;
  var level = 1;
  var health = 9;
  var kills = 0;

  var player = '@';
  var wall = '#';
  var floor = '.'; 
  var stairs = '>';
  var enemy = 'M'; 
  
  var separator = '~';

  var dungeon = [];
  var enemies = [];
  
  //fix indexOf for unsupported browsers (ahem, IE)
  if( !Array.indexOf ){
    Array.prototype.indexOf = function( obj ){
      for( var i = 0; i < this.length; i++ ){
        if( this[ i ] == obj ){
          return i;
        }
      }
      return -1;
    }
  }
  
  //get the keyboard code and convert to a numpad value then pass that to
  //tick to update game
  function keyHandler( event ) {
    var key = keyFromEvent( event );
    var numPadValue = numPadValueFromKey( key );
    if( numPadValue ) {
      tick( numPadValue );
    }
  }
  
  //probably not great way to handle keyboard but seems to work in major 
  //browsers
  function keyFromEvent( e ) {
    var event = e ? e : window.event ? window.event : null;
    
    if( event ) {
      var key = event.charCode ? event.charCode : event.keyCode ? event.keyCode : event.which ? event.which : null;
      return key;
    }
    
    return null;          
  }  
  
  //firebug or some other debugger that has console.log exists, then log
  function log( value ) {
    //there may not be a console available, we don't want everything to 
    //explode if there isn't, it's not crucial
    try {
      console.log( value );
    } catch( e ) {
      // do nothing
    }
  }
  
  function numPadValueFromKey( key ) {
    //numlock is off or the browser treats numpad as numbers
    if( key > 48 && key < 58 ) {
      return key - 48;
    }
    
    //browser returns codes for numpad keys
    if( key > 96 && key < 106 ) {
      return key - 96;
    }
    
    //not a numpad value, don't care
    return null;
  }
  
  //reset the enemies and dungeon
  function resetLevel() {
    log( 'level reset' );
    
    enemies = [];
    dungeon = [];
    
    //generate enemies
    for( var i = 0; i < bigNumber * level * 2; i++ ) {
      //get a random location within ~500 squares of the player
      var randomX = utils.random( bigNumber ) - ( bigNumber / 2 );
      var randomY = utils.random( bigNumber ) - ( bigNumber / 2 );
      var location = getLocation( randomX, randomY );

      //add an enemy at this location - might be same location as an 
      //existing enemy, oh well
      enemies.push( location );

      //set the dungeon tile at the newly created enemy's position to enemy
      dungeon[ location ] = enemy;
    }
    
    //set dungeon tile at current player position to player symbol
    dungeon[ playerLocation() ] = player;   
  }
  
  //update console
  function tick( numpadValue ) {
    //if player pressed something on numpad (movement or 5 for pass a turn
    //without doing anything) then it counts as a turn, update game state
    if( numpadValue > 0 ) {
      //store player's current x and y location
      var oldPlayerX = playerX;
      var oldPlayerY = playerY;
      
      //here we handle movement. diagonal keys will trigger movement on both
      //axes.
      
      //numbers for left are 1,4,7 - as these are all 3 apart we can add 2 
      //to get 3,6,9 then mod 3 this value to see if it's a left key
      //otherwise, numbers for right are 3,6,9 so we can mod 3 these to see
      //if they're a right key
      if( ( numpadValue + 2 ) % 3 == 0 ) {
        playerX--;
      } else if( numpadValue % 3 == 0 ) {
        playerX++;
      }
      
      //up is 7,8,9 and down is 1,2,3
      if( numpadValue >= 7 ) {
        playerY--;
      } else if( numpadValue <= 3 ) {
        playerY++;
      }

      //get the string at the new location
      var newTile = dungeonTileAt( playerLocation() );    
        
      //if player is hitting an enemy
      if ( newTile == enemy ) {
        log( 'hit enemy' );
        
        //kill the enemy
        enemies.splice( enemies.indexOf( playerLocation() ), 1 );

        //set the tile where the enemy used to be to floor
        dungeon[ playerLocation() ] = floor;

        //Increment kills
        kills++;
      }

      //if the player moved onto stairs
      if ( newTile == stairs ) {
        log( 'level' );
        
        //new dungeon level, increment the current level
        level += 1;
        
        //reset level and enemies
        resetLevel();
      } else {
        //if the player tried to move onto something that isn't a floor, put 
        //them back where they were
        if ( newTile != floor ) {
          log( 'not floor' );
          playerX = oldPlayerX;
          playerY = oldPlayerY;
        } else log( 'moved' );
        
        //set the last tile that the player was on to floor
        var oldLocation = getLocation( oldPlayerX, oldPlayerY );
        dungeon[ oldLocation ] = floor;
        
        //set the tile that the player is currently on to player symbol
        dungeon[ playerLocation() ] = player;
      }


      var blockedCount = 0;
      var movedCount = 0;
      //iterate through the remaining enemies
      for ( var i = 0; i < enemies.length; i++ ) {
        var enemyLocation = enemies[ i ];
        
        //store the current enemy's location
        var enemyX = xFromLocation( enemyLocation );
        var enemyY = yFromLocation( enemyLocation );

        //get location closer to player
        var potentialEnemyX = makeNumberCloser( enemyX, playerX ); 
        var potentialEnemyY = makeNumberCloser( enemyY, playerY ); 

        //get the potential new enemy coordinate
        var newEnemyLocation = getLocation( potentialEnemyX, 
          potentialEnemyY );

        //if the dungeon tile is floor, move the enemy onto the new 
        //coordinate
        if ( dungeonTileAt( newEnemyLocation ) == floor ) {
          //change the enemy's location in the enemy list
          enemies[ i ] = newEnemyLocation;
          
          //set the dungeon tile at the new location
          dungeon[ newEnemyLocation ] = enemy;
          
          //set the dungeon tile at the old location to floor
          var oldLocation = getLocation( enemyX, enemyY );
          dungeon[ oldLocation ] = floor;
        
          movedCount++;
        } else {
          blockedCount++;
        }

        //if the dungeon tile the enemy tried to move to contains the 
        //player, decrement the player's health
        if ( dungeonTileAt( newEnemyLocation ) == player ) {
          log( 'enemy hits player' );
          health--;
        }

        //player is dead
        if ( health < 1 ) {
          log( 'player dead' );
          
          //reset level number, health, kills
          level = 1;
          health = 9;
          kills = 0;
          
          //reset level and enemies
          resetLevel();
        }    
      }
      log( movedCount + ' enemies moved' );
      log( blockedCount + " enemies couldn't move" );
    }
    
    jConsole.setCursorPosition( 0, 0 );

    //calculate the viewport size
    var viewportSize = viewportRadius * 2 - 1;
    
    //draw visible dungeon tiles to viewport
    for ( var y = 0; y++ < viewportSize; ) {
      for ( var x = 0; x++ < viewportSize; ) {
        //get tile at location x,y
        var viewportLocation = getLocation( x - viewportRadius + playerX, 
          y - viewportRadius + playerY );
        var viewportTile = dungeonTileAt( viewportLocation );
        
        //if tile is a wall then assign color the level number, otherwise 
        //assign it 7 (gray)
        var color = viewportTile == wall ? level : 7;

        //only colors in range 0-15 are valid, so if color is higher than 
        //15, keep subtracting 15 until it isn't anymore.
        while ( color > 15 ) {
          color -= 15;
        }

        //Set foreground color, or 7 (gray) if color is < 1
        jConsole.foregroundColor = jConsole.intToColor( color < 1 ? 7 : color );
        
        //draw the current dungeon tile
        jConsole.write( viewportTile );
      }

      //start a new row
      jConsole.newLine();
    }

    //set color to gray
    jConsole.foregroundColor = jConsole.intToColor( 7 );
    
    //separate level, health and kills with a floor tile and draw below 
    //viewport
    jConsole.write( "L" + level + floor + "H" + health + floor + "K" + kills );   
  }
  
  function playerLocation() {
    return getLocation( playerX, playerY );
  }
  
  function makeNumberCloser( number, targetNumber ) {
    var newNumber = number;
    if( newNumber < targetNumber ) {
      newNumber++;
    } else if( newNumber > targetNumber ) {
      newNumber--;
    }  
    
    return newNumber;
  }  

  function dungeonTileAt( location ) {
    //if we haven't generated a tile at location do so now
    if( !dungeon[ location ] ) {
      if( utils.random( bigNumber * 9 ) < 9 ) {
        dungeon[ location ] = stairs;
      } else if( utils.random( 9 ) < 7 ) {
        dungeon[ location ] = floor;
      } else {
        dungeon[ location ] = wall;
      }
    }
    return dungeon[ location ];
  }
  
  function getLocation( x, y ) {
    return x + separator + y;
  }

  function xFromLocation( location ) {
    return xOrYFromLocation( location, 0 );
  }
  
  function yFromLocation( location ) {
    return xOrYFromLocation( location, 1 );
  }
  
  function xOrYFromLocation( location, i ) { 
    return location.split( separator )[ i ]; 
  } 

  resetLevel();  
  document.onkeypress = keyHandler;
  
  //show viewport for first time
  tick( -1 );
}