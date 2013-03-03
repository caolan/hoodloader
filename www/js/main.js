window.hoodie  = new Hoodie()

function showDashboard () {
  var $dashboard = $('#dashboard')
  $dashboard.show()
  $('#sign-in').hide()

  var numNewUsers       = 0
  var numConfirmedUsers = 0
  var numTotalUsers     = 0

  var $newUsers       = $('#dashboard .users .new').text(numNewUsers)
  var $confirmedUsers = $('#dashboard .users .confirmed').text(numConfirmedUsers)
  var $totalUsers     = $('#dashboard .users .total').text(numTotalUsers)

  var usersMap = {}

  hoodie.admin.users.connect()
  hoodie.admin.users.on('add', function(object) {
    usersMap[object.id] = object
    if (object.$state === 'confirmed') {
      $('#dashboard .users .confirmed').text(++numConfirmedUsers)
    } else {
      $('#dashboard .users .new').text(++numNewUsers)
    }

    $totalUsers = $('#dashboard .users .total').text(++numTotalUsers)
  })
  hoodie.admin.users.on('remove', function(object) {
    delete usersMap[object.id]
    if (object.$state === 'confirmed') {
      $('#dashboard .users .confirmed').text(--numConfirmedUsers)
    } else {
      $('#dashboard .users .new').text(--numNewUsers)
    }

    $totalUsers = $('#dashboard .users .total').text(--numTotalUsers)
  })
  hoodie.admin.users.on('update', function(object) {
    if (usersMap[object.id].$state !== 'confirmed' && object.$state === 'confirmed') {
      $('#dashboard .users .new').text(--numNewUsers)
      $('#dashboard .users .confirmed').text(++numConfirmedUsers)
    }
  })
}
function showSign () {
  $('#sign-in').show()
  $('#dashboard').hide()
}
function signIn(event) {
  event.preventDefault();

  var password = $(event.target).find('input[type=password]').val()

  hoodie.admin.signIn( password )
  .then( showDashboard )
  .fail( showError )
}

function showError (error) {
  var $signIn = $('#sign-in')
  $signIn.find('.alert').remove()
  $signIn.prepend( buildAlertHtml(error) )
}
function buildAlertHtml(error) {
  return '<p class="alert alert-error"><strong>'+error.error+'</strong>: '+error.reason+'</p>'
}

function addTestUsers (event) {
  event.preventDefault()
  $el = $(event.target)
  hoodie.admin.users.addTestUsers( parseInt($el.data('num') || 10) )
}


// init
$( function() {  
  hoodie.admin.authenticate()
  .then( showDashboard, showSign );

  $('#sign-in').on('submit', signIn)
  $('body').on('click', '.users .add', addTestUsers )
});