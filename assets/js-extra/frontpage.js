/* Frontpage JS */

// Document ready
$(document).ready(function() {

	configureNav();
	performAnimations();
		
	$(window).scroll(function() {

		configureNav();
		performAnimations();

	});
		
	$(window).resize(function() {

		configureNav();
		performAnimations();

	});

	// Scroll to top on logo click
	$('#logo-link').click(function (event){
        
        event.preventDefault();

        $('html, body').animate({
            scrollTop: 0
        }, 800);
    
    });

	// Scroll to section
    $('.nav li a').click(function (event){
        
        

        var target = $(this).attr('data-section');

        if (target)
        {
           event.preventDefault();
       	   $('html, body').animate({
       	     scrollTop: ($(target).offset().top - 72)
     	   }, 800);
    	}
    
    });

    // Youtube link clicked
    $('.recent-shoot-link').click(function (event){
        
        event.preventDefault();

        $('#modal-iframe').hide();

        $('#modal-iframe').attr('src', $(this).attr('href'));

        $('#background-overlay').fadeIn(200);

        $('.youtube-modal').addClass('bounceInDown');

        var t = setTimeout(function() {

        	$('#modal-iframe').show();

        }, 500);
    
    });

    // Close modal on background click
    $('#background-overlay').click(function (event){

        $('#modal-iframe').attr('src', '');
        $('#background-overlay').fadeOut(200);
    
    });

    // Close modal on button click
    $('#close-modal-button').click(function (event){
        $('#modal-iframe').attr('src', '');
        $('#background-overlay').fadeOut(200);
    
    });

});

// Configure nav bar layout and styles
function configureNav() {

	var scroll_position = $(window).scrollTop();

	if ((scroll_position > 65) || ($('body').width() < 768)) {

		$('.navbar').addClass('solid-background');
		$('.navbar #logo').attr('src', '/images/logo-white.png');

	} else if (scroll_position < 60) {

		$('.navbar').removeClass('solid-background');
		$('.navbar #logo').attr('src', '/images/logo-black.png');

	}
}

// Perform animations
function performAnimations() {

	if (($('body').width() < 768)) {
		// return;
	}

	var scroll_position = $('body').scrollTop();
	var position = $('#timeline-container').offset().top;
	var fade_position = -$(window).innerHeight();

	if ((scroll_position - position) > fade_position) {

		$('.fixed-label').addClass('fadeIn');

	}
}