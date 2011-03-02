var jConsole = {
  backgroundColor: '#000',
  foregroundColor: '#888',
  colors: [ '#000', '#008', '#080', '#088', '#800', '#808', '#880', '#888', '#00f', '#0f0', '#0ff', '#f00', '#f0f', '#ff0', '#fff' ],
  cellCache: [],
  container: document.body,
  windowWidth: 80,
  windowHeight: 25,

  getCellId: function( left, top ) {
    return 'cell-' + left + '-' + top;
  },
  
  getColorClassName: function( identifier, color ) {
    return identifier + '-' + color.replace( '#', 'hex-' );
  },
  
  getForegroundColorClassName: function( color ) {
    return this.getColorClassName( 'foregroundColor', color );
  },
  
  getBackgroundColorClassName: function( color ) {
    return this.getColorClassName( 'backgroundColor', color );
  },
  
  initializeConsole: function( container, width, height ) {
    this.container = container; 
    this.windowWidth = width;
    this.windowHeight = height;  
    
    this.setupCache();
    this.clear();
    this.setCursorPosition( 0, 0 );    
    this.cursorVisible = true;
  },
  
  updateDOM: function( left, top ) {
    var cell = this.cellCache[ left ][ top ];
    var element = cell.element;
    var foregroundRule, backgroundRule;
    
    if( !element.firstChild ) {
      var textNode = document.createTextNode( cell.character );
      element.appendChild( textNode );      
    } else {
      element.firstChild.nodeValue = cell.character;
    }

    var foregroundColorClassName = this.getForegroundColorClassName( cell.foregroundColor );
    var foregroundColorSelector = '.' + foregroundColorClassName;
    if( !this.getCSSRule( foregroundColorSelector ) ) {
      foregroundRule = this.addCSSRule( foregroundColorSelector );
      foregroundRule.style.color = this.foregroundColor;
    }
    
    var backgroundColorClassName = this.getBackgroundColorClassName( cell.backgroundColor );
    var backgroundColorSelector = '.' + backgroundColorClassName;
    if( !this.getCSSRule( backgroundColorSelector ) ) {
      backgroundRule = this.addCSSRule( backgroundColorSelector );
      backgroundRule.style.backgroundColor = this.backgroundColor;
    }
    
    element.className = foregroundColorClassName + ' ' + backgroundColorClassName;
  },
  
  setCell: function( character, left, top, foregroundColor, backgroundColor ) {
    var cell = this.cellCache[ left ][ top ];
    
    var cellChanged = !( cell.character === character && cell.foregroundColor === foregroundColor && cell.backgroundColor === backgroundColor );
      
    if( cellChanged ) {
      cell.character = character;
      cell.foregroundColor = foregroundColor;
      cell.backgroundColor = backgroundColor;
      
      this.updateDOM( left, top );
    }
  },
  
  removeElements: function( element ) {
    if ( element.hasChildNodes() ) {
      while ( element.childNodes.length >= 1 ) {
        element.removeChild( element.firstChild );       
      } 
    }
  },
  
  setupCache: function() {
    var left, top;
    
    var cellCache = [];
    
    for( left = 0; left < this.windowWidth; left++ ) {
      this.cellCache[ left ] = [];
      for( top = 0; top < this.windowHeight; top++ ) {
        this.cellCache[ left ][ top ] = {};
      }
    }
    
    return cellCache;
  },
  
  clear: function() {
    var top, left;
    var clearChar = '\u00a0';
    var table = document.createElement( 'table' );
    var tbody = document.createElement( 'tbody' );
    
    table.style.borderCollapse = 'collapse';
    
    if( this.container.hasChildNodes() ) {
      this.removeElements( this.container );
    }
        
    for( top = 0; top < this.windowHeight; top++ ) {
      var tableRow = document.createElement( 'tr' );      
      for( left = 0; left < this.windowWidth; left++ ) {
        var tableCell = document.createElement( 'td' );

        tableRow.appendChild( tableCell );

        this.cellCache[ left ][ top ].element = tableCell;
        
        this.setCell( clearChar, left, top, this.foregroundColor, this.backgroundColor );
      }
      
      tbody.appendChild( tableRow );
    }
    
    table.appendChild( tbody );
    this.container.appendChild( table );
  },
  
  findPosition: function( element ) {
    var currentLeft, currentTop;
    currentLeft = currentTop = 0;
    
    if( element.offsetParent ) {
      do {
        currentLeft += element.offsetLeft - element.scrollLeft;
        currentTop += element.offsetTop - element.scrollTop;
      } while ( element = element.offsetParent );
    }
    
    return {
      left : currentLeft,
      top : currentTop
    };
  },
  
  findRelativePosition: function( element, compareToElement ) {
    var elementPosition = this.findPosition( element );
    var compareToElementPosition = this.findPosition( compareToElement );
    return {
      left: elementPosition.left - compareToElementPosition.left + this.container.offsetLeft,
      top: elementPosition.top - compareToElementPosition.top + this.container.offsetTop
    };
  },
  
  setCursorPosition: function( left, top ) {
    if( this.cursorVisible ) {
      var cursor = document.getElementById( "cursor" );
      
      if( !cursor ) {
        cursor = document.createElement( "div" );
   
        cursor.id = "cursor";
        cursor.style.textDecoration = "blink";
        cursor.style.position = "absolute";
        
        var cursorCharacter = document.createTextNode( "_" );
        cursor.appendChild( cursorCharacter );
        
        this.container.appendChild( cursor );
      }

      var cursorPosition = this.findRelativePosition( 
        this.cellCache[ left ][ top ].element,
        this.container 
      );
      
      cursor.style.color = this.foregroundColor;
      cursor.style.left = cursorPosition.left + "px";
      cursor.style.top = cursorPosition.top + "px";
    } 
    
    this.cursorLeft = left;
    this.cursorTop = top; 
  },
  
  showCursor: function() {
    this.cursorVisible = true;
  },
  
  hideCursor: function() {  
    this.cursorVisible = false;
  },
  
  setWindowSize: function( width, height ) {
    this.windowWidth = width;
    this.windowHeight = height;
  },
  
  write: function( value )  {
    var i;
    var cursorState = this.cursorVisible;
    
    if( this.cursorVisible ) {
      this.hideCursor();
    }
    
    for( i = 0; i < value.length; i++ ) {
      var character = value[ i ] === ' ' ? '\u00a0' : value[ i ];

      this.setCell( character, this.cursorLeft, this.cursorTop, this.foregroundColor, this.backgroundColor ); 
      
      this.cursorLeft++;
      if( this.cursorLeft >= this.windowWidth ) {
        this.cursorLeft = 0;
        this.cursorTop++;
        if( this.cursorTop >= this.windowHeight ) {
          return;
        }
      }
    }
    
    if( cursorState ) {
      this.showCursor();
    }
    
    this.setCursorPosition( this.cursorLeft, this.cursorTop );    
  },
   
  writeLine: function( value ) {
    this.write( value );
    this.newLine();
  },
  
  newLine: function() {
    this.setCursorPosition( 0, this.cursorTop + 1 );
  },
  
  blit: function( tiles ) {
    for( i in tiles ) {
      var tile = tiles[ i ];
      this.foregroundColor = tile.F;
      this.backgroundColor = tile.B;
      this.write( tile.C );
    }
  },
  
  intToColor: function( i ) {
    return this.colors[ i ];
  },
  
  //CSS stuff shamelessly stolen from http://www.hunlock.com/blogs/Totally_Pwn_CSS_with_Javascript  
  getCSSRule: function(ruleName, deleteFlag) {
    ruleName=ruleName.toLowerCase();                       
    if (document.styleSheets) {                            
      for (var i=0; i<document.styleSheets.length; i++) { 
        var styleSheet=document.styleSheets[i];          
        var ii=0;                                        
        var cssRule=false;                               
        do {                                             
          if (styleSheet.cssRules) {                    
            cssRule = styleSheet.cssRules[ii];         
          } else {                                      
            cssRule = styleSheet.rules[ii];            
          }                                             
          if (cssRule)  {                               
            if (cssRule.selectorText.toLowerCase()==ruleName) {
              if (deleteFlag=='delete') {             
                if (styleSheet.cssRules) {           
                  styleSheet.deleteRule(ii);        
                } else {                             
                  styleSheet.removeRule(ii);        
                }                                    
                return true;                         
              } else {                                
                return cssRule;                      
              }                                       
            }                                          
          }                                             
          ii++;                                         
        } while (cssRule)                                
      }                                                   
    }                                                      
    return false;                                          
  },

  killCSSRule: function(ruleName) {                          
    return getCSSRule(ruleName,'delete');                  
  },

  addCSSRule: function(ruleName) {                           
    if (document.styleSheets) {                            
      if (!this.getCSSRule(ruleName)) {                        
        if (document.styleSheets[0].addRule) {           
          document.styleSheets[0].addRule(ruleName, null,0);
        } else {                                         
          document.styleSheets[0].insertRule(ruleName+' { }', 0); 
        }                                              
      }                                                 
    }                                                    
    return this.getCSSRule(ruleName);                         
  }  
};