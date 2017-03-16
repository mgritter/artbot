'use strict';

angular.module('myApp.traceryView', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/tracery', {
    templateUrl: 'traceryView/traceryView.html',
    controller: 'View1Ctrl'
  });
}])
    .controller('View1Ctrl', ['$scope', '$sce', function($scope, $sce) {
	$scope.svg1 = "";
	$scope.svg2 = "";
	$scope.svg3 = "";

	// It would be possible to generate Tracery from Tracery with enough
	// escaping.  Instead we'll generate rules with the following
	// convention
	// A rule reference #abc# becomes ((abc))
	// A string literal "abc" becomes {abc}
	// A list [a, b, c] becomes <<a, b, c>>
	// and any " can be used unescaped (we'll escape them first.)
	var modifiers = {
	    standardize : function( s ) {
		return s.replace( /"/g, "\\\\\"" )
		    .replace( /\(\(/g, "#" )
		    .replace( /\)\)/g, "#" )
		    .replace( /\{/g, "\"" )
		    .replace( /\}/g, "\"" )
		    .replace( /<</g, "[" )
		    .replace( />>/g, "]" )
	    }
	};
	
	var CSS_COLOR_NAMES = ["AliceBlue","AntiqueWhite","Aqua","Aquamarine","Azure","Beige","Bisque","Black","BlanchedAlmond","Blue","BlueViolet","Brown","BurlyWood","CadetBlue","Chartreuse","Chocolate","Coral","CornflowerBlue","Cornsilk","Crimson","Cyan","DarkBlue","DarkCyan","DarkGoldenRod","DarkGray","DarkGrey","DarkGreen","DarkKhaki","DarkMagenta","DarkOliveGreen","Darkorange","DarkOrchid","DarkRed","DarkSalmon","DarkSeaGreen","DarkSlateBlue","DarkSlateGray","DarkSlateGrey","DarkTurquoise","DarkViolet","DeepPink","DeepSkyBlue","DimGray","DimGrey","DodgerBlue","FireBrick","FloralWhite","ForestGreen","Fuchsia","Gainsboro","GhostWhite","Gold","GoldenRod","Gray","Grey","Green","GreenYellow","HoneyDew","HotPink","IndianRed","Indigo","Ivory","Khaki","Lavender","LavenderBlush","LawnGreen","LemonChiffon","LightBlue","LightCoral","LightCyan","LightGoldenRodYellow","LightGray","LightGrey","LightGreen","LightPink","LightSalmon","LightSeaGreen","LightSkyBlue","LightSlateGray","LightSlateGrey","LightSteelBlue","LightYellow","Lime","LimeGreen","Linen","Magenta","Maroon","MediumAquaMarine","MediumBlue","MediumOrchid","MediumPurple","MediumSeaGreen","MediumSlateBlue","MediumSpringGreen","MediumTurquoise","MediumVioletRed","MidnightBlue","MintCream","MistyRose","Moccasin","NavajoWhite","Navy","OldLace","Olive","OliveDrab","Orange","OrangeRed","Orchid","PaleGoldenRod","PaleGreen","PaleTurquoise","PaleVioletRed","PapayaWhip","PeachPuff","Peru","Pink","Plum","PowderBlue","Purple","Red","RosyBrown","RoyalBlue","SaddleBrown","Salmon","SandyBrown","SeaGreen","SeaShell","Sienna","Silver","SkyBlue","SlateBlue","SlateGray","SlateGrey","Snow","SpringGreen","SteelBlue","Tan","Teal","Thistle","Tomato","Turquoise","Violet","Wheat","White","WhiteSmoke","Yellow","YellowGreen"];

	function rangeList( start, end, step ) {
	    var sb = [];
	    for ( var i = start; i < end; i += step ) {
		sb.push( "{" + i + "}" );
	    }
	    return "<<" + sb.join( "," ) + ">>";
	}
	
	var metagrammar = {
	    origin : "{\n#ruleset.standardize#\n}",
	    ruleset : "#svg##headerfooter##proportion##palette##strokestyle##linedef##lineCount##endpoints#{catchAll} : {}\n",
	    svg : "{origin} : {((setupEndpoints))((header))((drawLines))((footer))},\n",
	    headerfooter : "{header} : {<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" height=\"((height))\" width=\"((width))\">},\n{footer} : {</svg>},\n",
	    proportion : "#height##width#",
	    height : [ "{height} : {200},\n" +
		       "{yOddGrid} : " + rangeList( 1, 20, 2 ) + ",\n" +
		       "{yEvenGrid} : " + rangeList( 0, 20, 2 ) + ",\n" +
		       "{yGrid} : " + rangeList( 0, 20, 1 ) + ",\n" ],
	    
	    // Several widths available, each with a way of choosing x positions
	    width : [ "{width} : {200},\n" +
		      "{xOddGrid} : " + rangeList( 1, 20, 2 ) + ",\n" +
		      "{xEvenGrid} : " + rangeList( 0, 20, 2 ) + ",\n" +
		      "{xGrid} : " + rangeList( 0, 20, 1 ) + ",\n",
		      
		      "{width} : {360},\n" +
		      "{xOddGrid} : " + rangeList( 1, 36, 2 ) + ",\n" +
		      "{xEvenGrid} : " + rangeList( 0, 36, 2 ) + ",\n" +
		      "{xGrid} : " + rangeList( 0, 36, 1 ) + ",\n",

		      "{width} : {140},\n" +
		      "{xOddGrid} : " + rangeList( 1, 14, 2 ) + ",\n" +
		      "{xEvenGrid} : " + rangeList( 0, 14, 2 ) + ",\n" +
		      "{xGrid} : " + rangeList( 0, 14, 1 ) + ",\n"
		    ],
	    
	    palette : [ "#bichromatic#", "#trichromatic#" ],
	    color : CSS_COLOR_NAMES,
	    bichromatic : "{linecolor} : << {#color#}, {#color#} >>,\n",
	    trichromatic : "{linecolor} : << {#color#}, {#color#}, {#color#} >>,\n",
	    linedef : "{line} : {<path d=\"((linepath))\" stroke=\"((linecolor))\" stroke-width=\"((linewidth))\" transform=\"((linetransform))\"/>},\n",

	    // Thick lines should be paired with small line count //
	    strokestyle : [ "[lineCount:#fewLines#]#thicklines#",
			    "[lineCount:#anyNumberOfLines#]#thinlines#",
			    "[lineCount:#anyNumberOfLines#]#variedthin#",
			    "[lineCount:#anyNumberOfLines#]#mediumlines#",
			    "[lineCount:#fewLines#]#thickAndThin#" ],
	    
	    thicklines : "{linewidth} : << #thickWidth# #moreThick# >>,\n",
	    digit : [ "0", "1", "2", "3", "4", "5", "6", "7", "8", "9" ],
	    thickWidth : [ "{2#digit#}", "{3#digit#}", "{4#digit#}" ],
	    moreThick : [ "", "", ", #thickWidth# #moreThick#" ],

	    thinlines : "{linewidth} : {1},\n",

	    variedthin : "{linewidth} : << #thinWidth# #moreThin# >>,\n",
	    thinWidth : [ "{1}", "{2}", "{3}", "{4}" ],
	    moreThin : [ "", "", ", #thinWidth# #moreThin#" ],

	    mediumlines : "{linewidth} : << #mediumWidth# #moreMedium# >>,\n",
	    mediumWidth : [ "{5}", "{6}", "{7}", "{8}", "{9}", "{1#digit#}" ],
	    moreMedium : [ "", "", ", #mediumWidth# #moreMedium#" ],

	    thickAndThin: "{linewidth} : << #thinWidth#, #thickWidth# >>,\n",
	    
	    fewLines : "#repeatedDef#{drawLines} : {((tenLines))},\n",
	    anyNumberOfLines :
	    [ "#repeatedDef#{drawLines} : {((tenLines))},\n",
	      "#repeatedDef#{drawLines} : {((tenLines))((tenlines))((tenlines))},\n",
	      "#repeatedDef#{drawLines} : {((hundredLines))},\n",
	      "#repeatedDef#{drawLines} : {((hundredLines))((hundredLines))},\n" ],

	    repeatedDef : "{tenLines} : {((line))((line))((line))((line))((line))((line))((line))((line))((line))((line))((line))},\n" +
		"{hundredLines}:  {((tenLines))((tenLines))((tenLines))((tenLines))((tenLines))((tenLines))((tenLines))((tenLines))((tenLines))((tenLines))},\n",
	    
	    endpoints : [ "#freeLines#",
			  "#gridLines#",
			  "#fewStart#",
			  "#fewDeltas#",
			  "#rotatedFixedLength#" ],

	    stdtransform : "{linetransform} : {},\n",
	    stdpos :  
	    `
	    {xpos} : {<<x:((xGrid))((digit))>>((x))},
	    {ypos} : {<<y:((yGrid))((digit))>>((y))},
	    {digit} : << {0}, {1}, {2}, {3}, {4}, {5}, {6}, {7}, {8}, {9} >>,
	    `,
	    stdsetup : "{setupEndpoints} : {},\n",
	    stdpath : "{linepath} : {((lineStart)) ((lineEnd))},\n",
	    stdStart : "{lineStart} : {M((xpos)) ((ypos))},\n",
	    stdEnd : "{lineEnd} : {L((xpos)) ((ypos))},\n",
	    
	    freeLines : "#stdsetup##stdtransform##stdpath##stdpos##stdStart##stdEnd#",	    
	    gridLines : "#stdsetup##stdtransform##stdpath##gridpos##stdStart##stdEnd#",

	    gridpos : `
	    {xpos} : {((xOddGrid))0},
	    {ypos} : {((yOddGrid))0},
	    `,

	    // Rather than picking a common endpoint, this causes the
	    // bot to pick an endpoint as part of the 'setup' rule.
	    fewStart :  "#stdpath##stdtransform##stdpos##stdEnd##fixedPointRules#",
	    fixedPointRules : [ "#onePointRule#", "#twoPointRule#",
				"#threePointRule#" ],
	    onePointRule : "{setupEndpoints} : {<<sp1:M #xpos# #ypos#>>},\n" +
		"{lineStart} : << {((sp1))} >>,\n",
	    twoPointRule : "{setupEndpoints} : {<<sp1:M #xpos# #ypos#>><<sp2:M #xpos# #ypos#>>},\n" +
		"{lineStart} : << {((sp1))}, {((sp2))} >>,\n",
	    threePointRule : "{setupEndpoints} : {<<sp1:M #xpos# #ypos#>><<sp2:M #xpos# #ypos#>><<sp3:M #xpos# #ypos#>>},\n" +
		"{lineStart} : << {((sp1))}, {((sp2))}, {((sp3))} >>,\n",

	    // Same here, the bot picks a delta for each picture.
	    fewDeltas : "#stdpath##stdtransform##stdpos##stdStart##deltas##deltaEndpointRules#",
	    deltas : "{xdelta} : <<{0}, {1((digit))}, {-1((digit))},  {2((digit))}, {-2((digit))}, {3((digit))}, {-3((digit))}>>,\n"+
		"{ydelta} : {((xdelta))},\n",
	    
	    deltaEndpointRules : [ '#oneDeltaRule#', '#twoDeltaRule#',
				   '#threeDeltaRule#' ],
	    oneDeltaRule : "{setupEndpoints} : {<<ep1:l #xdelta# #ydelta#>>},\n" +
		"{lineEnd} : << {((ep1))} >>,\n",
	    twoDeltaRule : "{setupEndpoints} : {<<ep1:l #xdelta# #ydelta#>><<ep2:l #xdelta# #ydelta#>>},\n" +
		"{lineEnd} : << {((ep1))}, {((ep2))} >>,\n",
	    threeDeltaRule : "{setupEndpoints} : {<<ep1:l #xdelta# #ydelta#>><<ep2:l #xdelta# #ydelta#>><<ep3:l #xdelta# #ydelta#>>},\n" +
		"{lineEnd} : << {((ep1))}, {((ep2))}, {((ep3))} >>,\n",

	    rotatedFixedLength : "#stdpath##rotateTransform##stdpos##stdStart##deltas##oneDeltaRule#",
	    rotateTransform : "{linetransform} : {rotate( ((angle)) ((x)) ((y)) )},\n#angleRule#",
	    angleRule : ["#angleUniform#",
			 "#angle45#",
			 "#angle120#"],
	    angleUniform : "{angle} : " + rangeList( 0, 360, 1 ) + ",\n",
	    angle45 : "{angle} : " + rangeList( 0, 360, 45 ) + ",\n",
	    angle120 : "{angle} : " + rangeList( 0, 360, 120 ) + ",\n"
	}
	
	$scope.grammar = tracery.createGrammar( metagrammar );
	$scope.grammar.addModifiers( modifiers );

	$scope.genGallery = function() {
	    $scope.svg1 = $sce.trustAsHtml( $scope.botGrammar.flatten( "#origin#" ) );
	    $scope.svg2 = $sce.trustAsHtml( $scope.botGrammar.flatten( "#origin#" ) );
	    $scope.svg3 = $sce.trustAsHtml( $scope.botGrammar.flatten( "#origin#" ) );
	}

	$scope.genBot = function() {
	    $scope.botText = $scope.grammar.flatten( "#origin#" );
	    console.log( $scope.botText );
	    $scope.botJson = JSON.parse( $scope.botText );	
	    $scope.botGrammar = tracery.createGrammar( $scope.botJson );
	    $scope.botPretty = JSON.stringify( $scope.botJson, null, 2 );
	    $scope.genGallery();
	}

	$scope.genBot();
    }
]);
