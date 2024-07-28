var w = c.width = window.innerWidth,
		h = c.height = window.innerHeight,
		ctx = c.getContext( '2d' ),
		
		opts = {
			backgroundColor: 'hsl(0,0%,0%)',
			gradientColors: [ 'hsla(200,80%,60%,.5)', 'hsla(200,80%,30%,.4)', 'hsla(0,0%,30%,0)'],
			baseLight: 0,
			addedLight: 100,
			
			cx: w / 2,
			cy: h / 2,
			
			pcx: w / 2 - 100,
			pcy: h / 2,
			
			pacRadius: 50,
			pacTime: 20,
			pacRadiant: 1,
			pacColor: 'hsl(270,80%,63%)',
			pacBlur: 5,
			
			foodCount: 5,
			foodBaseDistance: 20,
			foodDistance: 300,
			foodSize: 10,
			foodColor: 'hsl(180,80%,60%)',
			foodShadow: 'hsl(220,80%,60%)',
			foodBlur: 10,
			
			text: 'NOM',
			textTime: 20,
			textColor: 'hsl(180,80%,60%)',
			baseTempRadiant: 1.1,
			addedTempRadiant: Math.PI - 1.1 - 1.1,
			
			trailX: w / 2 - 100 - 20,
			trailWidth: 200,
			trailHeight: 70,
			trailStrokeWidth: 4,
			trailColors: [ 'hsla(40,80%,75%,0)',  'hsla(40,80%,85%,.2)' ],
			trailStrokeColor: 'hsla(40,80%,80%.5)',
			
			particles: 40,
			particleBaseSize: 2,
			particleAddedSize: 2,
			particleBaseSpeed: 1.5,
			particleAddedSpeed: 1.5,
			particleBaseTime: 40,
			particleAddedTime: 20,
			particleColor: 'hsla(20,80%,75%,.8)'
			
		},
		
		bgCanvas = document.createElement( 'canvas' ),
		bgCtx = bgCanvas.getContext( '2d' ),
		
		tick = 0,
		tempText = '',
		tempTextLength = 0,
		tempRadiant = Math.PI / 2,
		tempTime = 0,
		particles = [];

ctx.font = '15px Verdana';

var textBase = -ctx.measureText( opts.text ).width / 2;

function init(){
	
	bgCanvas.width = w;
	bgCanvas.height = h;
	
	bgCtx.fillStyle = opts.backgroundColor;
	bgCtx.fillRect( 0, 0, w, h );
	
	var gradient = bgCtx.createRadialGradient( 
		opts.cx, opts.cy, 0,
		opts.cx, opts.cy, Math.sqrt( opts.cx*opts.cx + opts.cy*opts.cy ) );
	
	for( var i = 0; i < opts.gradientColors.length; ++i )
		gradient.addColorStop( i / opts.gradientColors.length, opts.gradientColors[ i ] );
	
	bgCtx.fillStyle = gradient;
	bgCtx.fillRect( 0, 0, w, h );
	
	for( var y = 0; y < h; ++y ){
		
		for( var x = 0; x < w; ++x ){
			bgCtx.fillStyle = 'hsla(0,0%,light%,.02)'.replace( 'light', ( opts.baseLight + opts.addedLight * Math.random() ) |0 );
			bgCtx.fillRect( x, y, 1, 1 );
		}
		
		bgCtx.fillStyle = y % 2 ? 
			'hsla(0, 0%, 0%, 0.1)' : 'hsla(0, 0%, 100%, 0.05)';
		bgCtx.fillRect( 0, y, w, 1 );
	}
	
	gradient = bgCtx.createLinearGradient( opts.trailX - opts.trailWidth, 0, opts.pcx, 0 );
	for( var i = 0; i < opts.trailColors.length; ++i )
		gradient.addColorStop( i / opts.trailColors.length, opts.trailColors[ i ] );//
	
	bgCtx.fillStyle = gradient;
	bgCtx.fillRect( opts.trailX - opts.trailWidth, opts.cy - opts.trailHeight / 2, opts.trailWidth, opts.trailHeight );
	
	bgCtx.fillStyle = bgCtx.shadowColor = opts.trailStrokeColor;
	bgCtx.shadowBlur = 5;
	bgCtx.beginPath();
	
	bgCtx.moveTo( opts.trailX, opts.cy - opts.trailHeight / 2 - opts.trailStrokeWidth / 2 );
	bgCtx.lineTo( opts.trailX, opts.cy - opts.trailHeight / 2 + opts.trailStrokeWidth / 2 );
	bgCtx.lineTo( opts.trailX - opts.trailWidth, opts.cy - opts.trailHeight / 2 );
	bgCtx.closePath();
	
	bgCtx.moveTo( opts.trailX, opts.cy + opts.trailHeight / 2 - opts.trailStrokeWidth / 2 );
	bgCtx.lineTo( opts.trailX, opts.cy + opts.trailHeight / 2 + opts.trailStrokeWidth / 2 );
	bgCtx.lineTo( opts.trailX - opts.trailWidth, opts.cy + opts.trailHeight / 2 );
	
	bgCtx.fill();
	
	bgCtx.shadowBlur = 0;
	
	anim();
}
function anim(){
	
	window.requestAnimationFrame( anim );
	
	ctx.fillStyle = '#222';
	ctx.fillRect( 0, 0, w, h );
	ctx.drawImage( bgCanvas, 0, 0 );
	
	++tick;
	
	drawFood();
	drawParticles();
	drawPacMan();
}
function drawFood(){
	
	ctx.fillStyle = opts.foodColor;
	ctx.shadowColor = opts.foodShadow;
	ctx.shadowBlur = opts.foodBlur;
	
	var time = tick % opts.pacTime,
			proportion = time / opts.pacTime,
			dist = opts.foodDistance / opts.foodCount,
			addedDist = ( dist + 1 ) * ( 1 - proportion );
	
	if( time === 0 ){
		
		tempRadiant = opts.baseTempRadiant + opts.addedTempRadiant * Math.random();
		
		if( Math.random() < .5 )
			tempRadiant *= -1;
	}
	
	for( var i = 0; i < opts.foodCount; ++i ){
		
		var size = i !== opts.foodCount - 1 ? opts.foodSize : opts.foodSize * proportion;
		
		ctx.fillRect( opts.pcx - size + dist * i + addedDist + opts.foodBaseDistance, opts.pcy - size, size * 2, size * 2 );
	}
	
	ctx.shadowBlur = 0;
	
	ctx.fillStyle = opts.textColor;
	
	if( time < opts.textTime ){
		
		ctx.save();
		
		var scale = time / opts.textTime;
		if( scale > .5 )
			scale = 1 - scale;
		
		scale *= 2;
		
		if( tempRadiant > 0 ){
		
			ctx.translate( opts.pcx, opts.pcy );
			ctx.rotate( tempRadiant );
			ctx.translate( opts.pacRadius + 15, 0 );
			ctx.rotate( -Math.PI / 2 );
			ctx.scale( scale, scale );
			ctx.fillText( opts.text, textBase, 0 );
			
		} else {
			
			ctx.translate( opts.pcx, opts.pcy );
			ctx.rotate( tempRadiant );
			ctx.translate( opts.pacRadius + 5, 0 );
			ctx.rotate( Math.PI / 2 );
			ctx.scale( scale, scale );
			ctx.fillText( opts.text, textBase, 0 );
		}
		
		ctx.restore();
	}

}
function drawParticles(){
	
	if( particles.length < opts.particles && Math.random() < .1 )
		particles.push( new Particle );
	
	ctx.fillStyle = ctx.shadowColor = opts.particleColor;
	ctx.shadowBlur = 4;
	ctx.beginPath();
	
	ctx.translate( opts.trailX, opts.cy - opts.trailHeight / 2 );
	particles.map( function( particle ){ particle.step(); } );
	ctx.translate( -opts.trailX, -( opts.cy - opts.trailHeight / 2 ) );
	
	ctx.fill();
}
function Particle(){
	this.reset();
}
Particle.prototype.reset = function(){
	
	this.x = 0;
	this.y = Math.random() * opts.trailHeight;
	
	this.speed = opts.particleBaseSpeed + opts.particleAddedSpeed * Math.random();
	this.vy = ( Math.random() - .5 ) * 2;
	
	this.tick = 0;
	this.time = ( opts.particleBaseTime + opts.particleAddedTime * Math.random() ) |0;
	
	this.size = ( opts.particleBaseSize + opts.particleAddedSize * Math.random() ) |0;
	
}
Particle.prototype.step = function(){
	
	++this.tick;
	
	var size = ( 1 - this.tick / this.time ) * this.size;
	
	this.x -= this.speed;
	this.y += this.vy + ( Math.random() -.5 ) * 2;
	
	ctx.moveTo( this.x + size, this.y );
	ctx.arc( this.x, this.y, size, 0, Math.PI * 2 );
	
	if( this.tick >= this.time )
		this.reset();
}
function drawPacMan(){
	
	ctx.fillStyle = ctx.shadowColor = opts.pacColor;
	ctx.shadowBlur = opts.pacBlur;
	
	var proportion = -Math.cos( tick / opts.pacTime * 2 * Math.PI ) / 2 + .5;
	
	ctx.beginPath();
	ctx.moveTo( opts.pcx, opts.pcy );
	ctx.arc( opts.pcx, opts.pcy, opts.pacRadius, opts.pacRadiant * proportion, Math.PI * 2 - opts.pacRadiant * proportion );
	ctx.fill();
	
	ctx.shadowBlur = 0;
}
init();
//anim();

loadDefaultImage();
//    canv.addEventListener('click', mouseClick);

messages.push({ message: "reset" });
window.requestAnimationFrame(animate);
