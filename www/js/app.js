// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
angular.module('starter', ['ionic', 'firebase'])

    .run(
        ['$ionicPlatform', '$rootScope',
            function ($ionicPlatform, $rootScope) {
                $ionicPlatform.ready(function () {
                    if (window.cordova && window.cordova.plugins.Keyboard) {
                        // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
                        // for form inputs)
                        cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);

                        // Don't remove this line unless you know what you are doing. It stops the viewport
                        // from snapping when text inputs are focused. Ionic handles this internally for
                        // a much nicer keyboard experience.
                        cordova.plugins.Keyboard.disableScroll(true);
                    }
                    if (window.StatusBar) {
                        StatusBar.styleDefault();
                    }
                });

                $rootScope.user = {
                    userId: 4,
                    nome: "Walter",
                    avatar: "http://www.avatarpro.biz/avatar?s=50"
                };
            }
        ]
    )

    .config(
        ['$stateProvider', '$urlRouterProvider',
            function ($stateProvider, $urlRouterProvider) {
                $stateProvider
                    .state('home', {
                        url: '/',
                        templateUrl: 'templates/home.html',
                        controller: 'HomeCtrl'
                    })
                    .state('chat', {
                        url: '/chat/:room',
                        templateUrl: 'templates/chat.html',
                        controller: 'ChatCtrl'
                    });
                $urlRouterProvider.otherwise('/')
            }
        ]
    )

    /*.factory('Message', ['$firebaseArray',
        function ($firebaseArray) {
            var ref = new Firebase('https://jsday-app.firebaseio.com/chat');
            var mok = new Firebase('https://jsday-app.firebaseio.com/chats');
            var rooms = $firebaseArray(ref);
            var messages = $firebaseArray(ref.child('geral').child('messages'));

            var Chat = {
                allMsg: messages,
                createMsg: function (message) {
                    return messages.$add(message);
                },
                getMsg: function (_room, _messageId) {
                    return $firebase(ref.child(_room).child('messages').child(_messageId)).$asObject();
                },
                deleteMsg: function (message) {
                    return messages.$remove(message);
                },
                setRoom: function (_room) {
                    messages = $firebaseArray(ref.child(_room).child('messages'));
                    return messages;
                },
                createRoom: function (_room) {
                    messages = $firebaseArray(ref.child(_room).child('messages'));
                    var agora = new Date();
                    messages.$add({
                        user: '@Bot',
                        text: 'Sala criada. [' + agora.getDate() + '/' + (agora.getMonth() + 1) + '/' + agora.getFullYear() + ']'
                    });
                    return messages;
                },
                allRooms: rooms,
                //allMyRooms: myRooms,
                mock: function(){
                    var userRooms = mok.child('userRooms');
                    var listRooms = mok.child('rooms');
                    var msgs = mok.child('messages');
                    var _dt = new Date();

                    var userArr = $firebaseArray(userRooms.child(4));
                    userArr.$add({room: "Viva Salute Bahia", since: _dt.getTime(), last: _dt.getTime()});
                    userArr.$add({room: "Viva Salute Rio de Janeiro", since: _dt.getTime(), last: _dt.getTime()});

                    var roomArr = $firebaseArray(listRooms);
                    roomArr.$add({room: "Viva Salute Bahia", registro: _dt.getTime(), users: 1, avatar: 'http'});
                    roomArr.$add({room: "Viva Salute Rio de Janeiro", registro: _dt.getTime(), users: 1, avatar: 'http'});
                    roomArr.$add({room: "Viva Salute São Paulo", registro: _dt.getTime(), users: 1, avatar: 'http'});
                    roomArr.$add({room: "Viva Salute Recife", registro: _dt.getTime(), users: 1, avatar: 'http'});

                    var msgArr = $firebaseArray(msgs);
                    msgArr.$add({
                        room: 'Viva Salute Bahia',
                        user: {
                            userId: 4,
                            nome: "Walter",
                            avatar: 'http'
                        },
                        registro: _dt.getTime(),
                        text: "lorem ipsun"
                    });
                }
            };

            return Chat;
        }
    ])*/

    .factory('Message', ['$firebaseArray', '$rootScope',
        function ($firebaseArray, $rootScope) {
            var ref = new Firebase('https://jsday-app.firebaseio.com/chats');
            var allRooms = $firebaseArray(ref.child('rooms'));
            var allMyRooms = $firebaseArray(ref.child('userRooms').child($rootScope.user.userId));

            var countMyRooms = [];
            allMyRooms.$loaded().then(function(arr) {
                arr.forEach(function (_val) {
                    var _msgs = $firebaseArray(ref.child('messages').orderByChild('room').equalTo(_val.room).limitToLast(100));
                    _msgs.$loaded().then(function (res) {
                        var _cont = res.filter(function (_m) { return _m.registro > _val.last; });
                        countMyRooms.push({room: _val.room, msgs: _cont.length});
                    });
                });
                console.info('countMyRooms', countMyRooms);
            });


            var Chat = {
                allMsg: function () {
                    console.info('allMsg');
                    return messages;
                },
                addMsg: function (_room, _message) {
                    var _dt = new Date();

                    if (!allMyRooms.filter(function (_r) { return _r.room == _room; }).length > 0){
                        allMyRooms.$add({
                            since: _dt.getTime(),
                            last: _dt.getTime(),
                            room: _room,
                            avatar: allRooms.filter(function (_r) { return _r.room == _room; })[0].avatar
                        });
                    } else {
                        allMyRooms.forEach(function (_r, _k) {
                            if (_r.room == _room){
                                allMyRooms[_k].last = _dt.getTime();
                                allMyRooms.$save(_k);
                            }
                        });
                    }

                    return messages.$add({
                        registro: _dt.getTime(),
                        room: _room,
                        text: _message,
                        user: $rootScope.user
                    });
                },
                getMsg: function (_room, _messageId) {
                    return $firebase(ref.child('messages').child(_messageId)).$asObject();
                },
                deleteMsg: function (message) {
                    return messages.$remove(message);
                },
                setRoom: function (_room) {
                    messages = $firebaseArray(ref.child('messages').orderByChild('room').equalTo(_room).limitToLast(100));
                    return messages;
                },
                setRoomLastView: function (_room) {
                    var _dt = new Date();
                    allMyRooms.forEach(function (_r, _k) {
                        if (_r.room == _room){
                            allMyRooms[_k].last = _dt.getTime();
                            allMyRooms.$save(_k);
                        }
                    });
                },
                getCountMsgs: function(_room, _last) {
                    var tmp = countMyRooms.filter(function (_r) { return _r.room == _room; });
                    return tmp[0] ? tmp[0].msgs : 0;
                },
                allRooms: function () {
                    console.info('allRooms');
                    return allRooms;
                },
                allMyRooms: function () {
                    console.info('allMyRooms');
                    return allMyRooms;
                },
            };

            return Chat;
        }
    ])

    .controller('HomeCtrl',
        ['$scope', '$rootScope', 'Message',
            function ($scope, $rootScope, Message) {
                console.info('HomeCtrl');
                $scope.rooms = Message.allRooms();
                $scope.myRooms = Message.allMyRooms();

                $scope.contaMsgs = function (_room) {
                    return Message.getCountMsgs(_room.room, _room.last);
                };
            }
        ]
    )

    .controller('ChatCtrl',
        ['$scope', '$stateParams', '$ionicScrollDelegate', '$timeout', 'Message',
            function ($scope, $stateParams, $ionicScrollDelegate, $timeout, Message) {
                $scope.room = $stateParams.room;
                $scope.messages = Message.setRoom($stateParams.room);
                $scope.texto = "";

                Message.setRoomLastView($stateParams.room);

                scro();

                $scope.sendClick = function(){
                    var agora = new Date();

                    if ($scope.texto) {
                        Message.addMsg($scope.room, $scope.texto);
                        $scope.texto = "";
                        scro();
                    }
                };

                function scro() {
                    $timeout(function(){
                        $ionicScrollDelegate.$getByHandle('mainScroll').scrollBottom();
                    }, 150);
                }
            }
        ]
    )
;
