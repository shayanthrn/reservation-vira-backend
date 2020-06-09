
function showReservationTimes($dayElement) {
  $activeCell = $reservationCarousel.find(".active")
  let key = $activeCell.data("key")

  $reserveTimesContainer
    .find(`.reserveTimes[data-key="${key}"`)
    .hide()

  $activeCell.removeClass("active")

  let newKey = $dayElement.data("key")
  $reserveTimesContainer
    .find(`.reserveTimes[data-key="${newKey}"`)
    .show()
  
  $dayElement.addClass("active")
}

var $carousel
var options = {
  pageDots: false,
  rightToLeft: true,
  //cellAlign:'right'
  contain:true
}

var $reservationCarousel = $('.reservation-carousel')
var $reserveTimesContainer = $("#reserveTimesContainer")

$(document).ready(function(){

  $carousel = $reservationCarousel.flickity(options)
  $reserveTimesContainer.children().hide()
  showReservationTimes($($('.carousel-cell')[0]))

  $carousel.on('staticClick.flickity', function(event, pointer, cellElement, cellIndex) {
    $cellElement = $(cellElement)
    if (!cellElement || $cellElement.hasClass('disabled'))
      return

    showReservationTimes($cellElement)
  });


});