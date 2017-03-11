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
	
	var metagrammar = {
	    origin : "{\n#ruleset.standardize#\n}",
	    ruleset : "#svg##headerfooter##proportion##palette##strokestyle##linedef##lineCount##endpoints#{catchAll} : {}\n",
	    svg : "{origin} : {((setupEndpoints))((header))((drawLines))((footer))},\n",
	    headerfooter : "{header} : {<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" height=\"#height#\" width=\"#width#\">},\n{footer} : {</svg>},\n",
	    proportion : "{height} : {200},\n{width} : {200},\n",
	    palette : [ "#bichromatic#", "#trichromatic#" ],
	    color : CSS_COLOR_NAMES,
	    bichromatic : "{linecolor} : << {#color#}, {#color#} >>,\n",
	    trichromatic : "{linecolor} : << {#color#}, {#color#}, {#color#} >>,\n",
	    linedef : "{line} : {<path d=\"((linepath))\" stroke=\"((linecolor))\" stroke-width=\"((linewidth))\"/>},\n",

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
	    anyNumberOfLines : [ "#repeatedDef#{drawLines} : {((tenLines))},\n",
				 "#repeatedDef#{drawLines} : {((hundredLines))},\n" ],

	    repeatedDef : "{tenLines} : {((line))((line))((line))((line))((line))((line))((line))((line))((line))((line))((line))},\n" +
		"{hundredLines}:  {((tenLines))((tenLines))((tenLines))((tenLines))((tenLines))((tenLines))((tenLines))((tenLines))((tenLines))((tenLines))},\n",
	    
	    endpoints : [ "#freeLines#", "#gridLines#", "#fewStart#",
			  "#fewDeltas#" ],

	    stdpos :  
	    `
	    {xpos} : {((r01))((digit))((digit))},
	    {ypos} : {((r01))((digit))((digit))},
	    {digit} : << {0}, {1}, {2}, {3}, {4}, {5}, {6}, {7}, {8}, {9} >>,
	    {r01} : << {0}, {1} >>,
	    `,
	    stdsetup : "{setupEndpoints} : {},\n",
	    stdpath : "{linepath} : {((lineStart)) ((lineEnd))},\n",
	    stdStart : "{lineStart} : {M((xpos)) ((ypos))},\n",
	    stdEnd : "{lineEnd} : {L((xpos)) ((ypos))},\n",
	    
	    freeLines : "#stdsetup##stdpath##stdpos##stdStart##stdEnd#",	    
	    gridLines : "#stdsetup##stdpath##gridpos##stdStart##stdEnd#",

	    gridpos : `
	    {xpos} : {((r01))((oddDigit))0},
	    {ypos} : {((r01))((oddDigit))0},
	    {oddDigit} : << {1}, {3}, {5}, {7}, {9} >>,
	    {r01} : << {0}, {1} >>,
	    `,

	    // Rather than picking a common endpoint, this causes the
	    // bot to pick an endpoint as part of the 'setup' rule.
	    fewStart :  "#stdpath##stdpos##stdEnd##fixedPointRules#",
	    fixedPointRules : [ "#onePointRule#", "#twoPointRule#",
				"#threePointRule#" ],
	    onePointRule : "{setupEndpoints} : {<<sp1:M #xpos# #ypos#>>},\n" +
		"{lineStart} : << {((sp1))} >>,\n",
	    twoPointRule : "{setupEndpoints} : {<<sp1:M #xpos# #ypos#>><<sp2:M #xpos# #ypos#>>},\n" +
		"{lineStart} : << {((sp1))}, {((sp2))} >>,\n",
	    threePointRule : "{setupEndpoints} : {<<sp1:M #xpos# #ypos#>><<sp2:M #xpos# #ypos#>><<sp3:M #xpos# #ypos#>>},\n" +
		"{lineStart} : << {((sp1))}, {((sp2))}, {((sp3))} >>,\n",

	    // Same here, the bot picks a delta for each picture.
	    fewDeltas : "#stdpath##stdpos##stdStart##deltas##deltaEndpointRules#",
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
