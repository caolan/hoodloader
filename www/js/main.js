window.hoodie  = new Hoodie('/_api')
var usersMap = {}

function showDashboard () {
  var $dashboard = $('#dashboard')
  $dashboard.show()
  $('#sign-in').hide()

  var numNewUsers       = 0
  var numConfirmedUsers = 0
  var numTotalUsers     = 0

  var $newUsers         = $('#dashboard .users .new').text(numNewUsers)
  var $confirmedUsers   = $('#dashboard .users .confirmed').text(numConfirmedUsers)
  var $totalUsers       = $('#dashboard .users .total').text(numTotalUsers)

  var numShares         = 0
  var numSubscriptions  = 0
  var $numShares        = $('#dashboard .shares .shares').text(numNewUsers)
  var $numSubscriptions = $('#dashboard .shares .subscriptions').text(numConfirmedUsers)

  

  hoodie.admin.users.connect()
  hoodie.admin.users.on('add', function(object) {
    usersMap[object.id] = object
    if (object.$state === 'confirmed') {
      $confirmedUsers.text(++numConfirmedUsers)
    } else {
      $newUsers.text(++numNewUsers)
    }

    $totalUsers.text(++numTotalUsers)
    renderUserLists()
  })
  hoodie.admin.users.on('remove', function(object) {
    delete usersMap[object.id]
    if (object.$state === 'confirmed') {
      $confirmedUsers.text(--numConfirmedUsers)
    } else {
      $newUsers.text(--numNewUsers)
    }

    $totalUsers.text(--numTotalUsers)
    renderUserLists()
  })
  hoodie.admin.users.on('update', function(object) {
    if (usersMap[object.id].$state !== 'confirmed' && object.$state === 'confirmed') {
      $newUsers.text(--numNewUsers)
      $confirmedUsers.text(++numConfirmedUsers)
    }
    
    usersMap[object.id] = object
    renderUserLists()
  })

  var shares = hoodie.admin.open('shares')
  shares.on('add', function(object) {
    if (object.type === '$share') {
      $numShares.text(++numShares)
    } else {
      $numSubscriptions.text(++numSubscriptions)
    }
  })
  shares.on('remove', function(object) {
    if (object.type === '$share') {
      $numShares.text(--numShares)
    } else {
      $numSubscriptions.text(--numSubscriptions)
    }
  })
  shares.connect()
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

function addUsers (event) {
  event.preventDefault()
  var $el = $(event.target)
  hoodie.admin.users.addTestUsers( parseInt($el.data('num') || 10) )
}
function removeUsers (event) {
  event.preventDefault()
  hoodie.admin.users.removeAll()
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

function addShares(event) {
  event.preventDefault()
  var addOptions = $(event.target).data()

  hoodie.admin.request('GET', '/_all_dbs')
  .then( function(dbNames) {
    dbNames = dbNames.filter(function(dbName) { return /^user\/\w+/.test(dbName) })
    var dbName = dbNames[Math.floor(Math.random()*dbNames.length)];
    var shareObject = generateShareObjectFor(dbName)
    var db = hoodie.admin.open(dbName)
    var docs = [shareObject]

    if( addOptions.numObjects ) {
      addOptions.numObjects = parseInt(addOptions.numObjects)
      while( addOptions.numObjects-- ) {
        docs.push( generateTestObjectFor(shareObject) )
      }
    }

    window.p = db.push(docs);
  })
};

function generateShareObjectFor(dbName) {
  return {
    "createdBy" : dbName.split(/\//).pop(),
    "updatedAt" : new Date,
    "createdAt" : new Date,
    "type" : "$share",
    "id" : hoodie.uuid()
  }
}
function generateTestObjectFor(shareObject) {
  return {
    "createdBy" : shareObject.createdBy,
    "updatedAt" : new Date,
    "createdAt" : new Date,
    "type" : "test",
    "id" : hoodie.uuid(),
    "$sharedAt" : shareObject.id
  }
}

// init
$( function() {  
  hoodie.admin.authenticate()
  .then( showDashboard, showSign );

  $('#sign-in').on('submit', signIn)
  $('body').on('click', '.users .add', addUsers )
  $('body').on('click', '.users .remove', removeUsers )
  $('body').on('click', '.shares .add', addShares )
});
