$hiddenForm = $("form.hidden-form")

$(".hidden-form .edit-button, .hidden-form .back-button").on('click', function () {
  $hiddenForm.toggleClass("edit")
})