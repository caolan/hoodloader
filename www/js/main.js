window.hoodie  = new Hoodie()
var usersMap = {}

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

  

  hoodie.admin.users.connect()
  hoodie.admin.users.on('add', function(object) {
    usersMap[object.id] = object
    if (object.$state === 'confirmed') {
      $('#dashboard .users .confirmed').text(++numConfirmedUsers)
    } else {
      $('#dashboard .users .new').text(++numNewUsers)
    }

    $totalUsers = $('#dashboard .users .total').text(++numTotalUsers)
    renderUserLists()
  })
  hoodie.admin.users.on('remove', function(object) {
    delete usersMap[object.id]
    if (object.$state === 'confirmed') {
      $('#dashboard .users .confirmed').text(--numConfirmedUsers)
    } else {
      $('#dashboard .users .new').text(--numNewUsers)
    }

    $totalUsers = $('#dashboard .users .total').text(--numTotalUsers)
    renderUserLists()
  })
  hoodie.admin.users.on('update', function(object) {
    if (usersMap[object.id].$state !== 'confirmed' && object.$state === 'confirmed') {
      $('#dashboard .users .new').text(--numNewUsers)
      $('#dashboard .users .confirmed').text(++numConfirmedUsers)
    }
    
    usersMap[object.id] = object
    renderUserLists()
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
  var $el = $(event.target)
  hoodie.admin.users.addTestUsers( parseInt($el.data('num') || 10) )
}
function removeTestUsers (event) {
  event.preventDefault()
  var $el = $(event.target)
  var num = parseInt($el.data('num'))
  if (num) {
    alert('tbd')
  } else {
    hoodie.admin.users.removeAll()
  }
}

function renderUserLists() {
  var userId
  var $newUsersTable = $('.pending-users.table')
  var html = ''
  var json

  for (userId in usersMap) {
    if (usersMap[userId].$state === 'confirmed') continue;

    json = JSON.stringify(usersMap[userId], '','  ')
    html += '<tr><th>'+userId+'</th><td><pre>'+json+'</pre></td></tr>'
  }

  $newUsersTable.html(html)
}


// init
$( function() {  
  hoodie.admin.authenticate()
  .then( showDashboard, showSign );

  $('#sign-in').on('submit', signIn)
  $('body').on('click', '.users .add', addTestUsers )
  $('body').on('click', '.users .remove', removeTestUsers )
});