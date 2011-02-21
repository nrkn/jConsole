var utils = {
  randomColor: function() {
    var r = this.random( 256 );
    var g = this.random( 256 );
    var b = this.random( 256 );
    
    return getHex( r, g, b );    
  },
  
  randomCharacter: function() {
    var intValue = this.random( 93 ) + 33;
    return String.fromCharCode( intValue );
  },
  
  intToHex: function( value ){
    value = value.toString( 16 );
    if( value.length < 2 ) value = "0" + value;
    return value;
  },

  getHex: function( r, g, b ){
    return '#' + intToHex( r ) + intToHex( g ) + intToHex( b );
  },
  
  random: function( i ) {
    return Math.floor( Math.random() * i );
  }
}