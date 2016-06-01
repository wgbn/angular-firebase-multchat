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

                /*$rootScope.user = {
                 userId: 0,
                 nome: "Walter",
                 avatar: "http://www.avatarpro.biz/avatar?s=50"
                 };*/
                //$rootScope.user = {};
            }
        ]
    )

    .config(
        ['$stateProvider', '$urlRouterProvider', '$httpProvider',
            function ($stateProvider, $urlRouterProvider, $httpProvider) {
                $stateProvider
                    .state('login', {
                        url: '/',
                        templateUrl: 'templates/login.html',
                        controller: 'LoginCtrl'
                    })
                    .state('home', {
                        url: '/home',
                        templateUrl: 'templates/home.html',
                        controller: 'HomeCtrl'
                    })
                    .state('chat', {
                        url: '/chat/:room',
                        templateUrl: 'templates/chat.html',
                        controller: 'ChatCtrl'
                    });
                $urlRouterProvider.otherwise('/');

                $httpProvider.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded; charset=UTF-8';

                var serialize = function (obj, prefix) {
                    var str = [];
                    for (var p in obj) {
                        if (obj.hasOwnProperty(p)) {
                            var k = prefix ? prefix + "[" + p + "]" : p, v = obj[p];
                            str.push(typeof v == "object" ?
                                serialize(v, k) :
                            encodeURIComponent(k) + "=" + encodeURIComponent(v));
                        }
                    }
                    return str.join("&");
                };

                $httpProvider.defaults.transformRequest = function (data) {
                    if (data === undefined) {
                        return data;
                    }
                    return serialize(data);
                };
            }
        ]
    )

    .factory('Api', ['$http', '$rootScope', '$state', '$ionicLoading',
        function ($http, $rootScope, $state, $ionicLoading) {
            var _url = 'https://vivasalute.com.br/mobile/api';
            var _self = this;
            var Api = {
                fazerLogin: function (_usuario, _senha) {
                    return $http.post(_url + '/loginMobile', {usuario: _usuario, senha: _senha});
                },
                getDadosUsuario: function () {
                    $ionicLoading.show({template: 'Carregando...'});
                    $http.get(_url + '/getDadosUsuario/user/' + $rootScope.usuario.username + '/token/' + $rootScope.usuario.token)
                        .then(function (ok) {
                            $ionicLoading.hide();

                            if (ok.status == 200 && ok.data.sucesso) {
                                $rootScope.usuario.nome = ok.data.usuario.perfil.nome;
                                $rootScope.usuario.avatar = ok.data.usuario.perfil.imagem;
                                $rootScope.usuario.avatar64 = ok.data.usuario.perfil.imagembase64;

                                $rootScope.user = {
                                    userId: $rootScope.usuario.userId,
                                    nome: $rootScope.usuario.nome.split(' ')[0],
                                    avatar: ok.data.usuario.perfil.imagem
                                };

                                Api.setLocalStorage('user', $rootScope.user);
                                Api.setLocalStorage('usuario', $rootScope.usuario);

                                $rootScope.$broadcast('dadosOk');
                            }
                        }, function (erro) {
                            $ionicLoading.hide();
                            console.log(erro);
                        });
                },
                setLocalStorage: function (_item, _valor) {
                    localStorage.setItem(_item, JSON.stringify(_valor));
                },
                getLocalStorage: function (_item) {
                    return JSON.parse(localStorage.getItem(_item));
                },
                verificaLogado: function () {
                    if (!$rootScope.user) {
                        if (Api.getLocalStorage('user')) {
                            $rootScope.user = Api.getLocalStorage('user');

                            if (!$rootScope.usuario) {
                                if (Api.getLocalStorage('usuario')) {
                                    $rootScope.usuario = Api.getLocalStorage('usuario');
                                } else {
                                    $state.go('login');
                                    return false;
                                }
                            }
                        } else {
                            $state.go('login');
                            return false;
                        }
                    }
                    return true;
                }
            };
            return Api;
        }
    ])

    .factory('Message', ['$firebaseArray', '$rootScope', 'Api',
        function ($firebaseArray, $rootScope, Api) {
            var ref;
            var allRooms;
            var allMyRooms;
            var messages;
            var countMyRooms = [];

            var Chat = {
                startFire: function () {
                    console.log("Firebase Start");

                    ref = new Firebase('https://jsday-app.firebaseio.com/chats');
                    allRooms = $firebaseArray(ref.child('rooms'));
                    allMyRooms = $firebaseArray(ref.child('userRooms').child($rootScope.user.userId ? $rootScope.user.userId : 0));

                    allMyRooms.$loaded().then(function (arr) {
                        arr.forEach(function (_val) {
                            var _msgs = $firebaseArray(ref.child('messages').orderByChild('room').equalTo(_val.room).limitToLast(100));
                            _msgs.$loaded().then(function (res) {
                                var _cont = res.filter(function (_m) {
                                    return _m.registro > _val.last;
                                });
                                countMyRooms.push({room: _val.room, msgs: _cont.length});
                            });
                        });
                    });
                },
                allMsg: function () {
                    console.info('allMsg');
                    return messages;
                },
                addMsg: function (_room, _message, _img) {
                    var _dt = new Date();

                    if (!allMyRooms.filter(function (_r) {
                            return _r.room == _room;
                        }).length > 0) {
                        allMyRooms.$add({
                            since: _dt.getTime(),
                            last: _dt.getTime(),
                            room: _room,
                            avatar: allRooms.filter(function (_r) {
                                return _r.room == _room;
                            })[0].avatar
                        });
                    } else {
                        allMyRooms.forEach(function (_r, _k) {
                            if (_r.room == _room) {
                                allMyRooms[_k].last = _dt.getTime();
                                allMyRooms.$save(_k);
                            }
                        });
                    }

                    var _msg = {
                        registro: _dt.getTime(),
                        room: _room,
                        text: _message,
                        user: $rootScope.user
                    };

                    if (_img) _msg.imagem = _img;

                    return messages.$add(_msg);
                },
                getMsg: function (_room, _messageId) {
                    return $firebase(ref.child('messages').child(_messageId)).$asObject();
                },
                deleteMsg: function (message) {
                    return messages.$remove(message);
                },
                setRoom: function (_room) {
                    messages = $firebaseArray(ref.child('messages').orderByChild('room').equalTo(_room).limitToLast(100));
                    messages.$watch(function (event) {
                        $rootScope.$broadcast('chatReload', {reload: true});
                    });
                    return messages;
                },
                setRoomLastView: function (_room) {
                    var _dt = new Date();
                    allMyRooms.forEach(function (_r, _k) {
                        if (_r.room == _room) {
                            allMyRooms[_k].last = _dt.getTime();
                            allMyRooms.$save(_k);
                        }
                    });
                },
                getCountMsgs: function (_room, _last) {
                    var tmp = countMyRooms.filter(function (_r) {
                        return _r.room == _room;
                    });
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

            if (Api.verificaLogado())
                Chat.startFire();

            return Chat;
        }
    ])

    .controller('LoginCtrl',
        ['$scope', '$rootScope', '$state', '$ionicLoading', '$ionicPopup', 'Api',
            function ($scope, $rootScope, $state, $ionicLoading, $ionicPopup, Api) {
                console.info('LoginCtrl');

                if ($rootScope.user)
                    $state.go('home');

                $scope.login = {
                    usuario: '',
                    senha: ''
                };

                $scope.loginClick = function () {
                    if ($scope.login.usuario && $scope.login.senha) {
                        $ionicLoading.show({template: 'Entrando...'});
                        Api.fazerLogin($scope.login.usuario, $scope.login.senha)
                            .then(function (ok) {
                                $ionicLoading.hide();

                                if (ok.status == 200 && ok.data.sucesso) {
                                    $rootScope.usuario = {
                                        username: ok.data.username,
                                        userId: ok.data.usuario_id,
                                        token: ok.data.token
                                    };
                                    Api.getDadosUsuario();
                                } else {
                                    $ionicPopup.alert({
                                        title: 'Oops!',
                                        template: ok.data.erro
                                    });
                                }
                            }, function (erro) {
                                $ionicLoading.hide();
                                $ionicPopup.alert({
                                    title: 'Oops!',
                                    template: 'Não foi possível conectar ao servidor.'
                                });
                                console.log(erro);
                            });
                    } else {
                        $ionicPopup.alert({
                            title: 'Oops!',
                            template: 'Preencha todos os campos.'
                        });
                    }
                };

                $scope.$on('dadosOk', function () {
                    $state.go('home');
                });

            }
        ]
    )

    .controller('HomeCtrl',
        ['$scope', '$rootScope', '$state', 'Message',
            function ($scope, $rootScope, $state, Message) {
                $scope.rooms = Message.allRooms();
                $scope.myRooms = Message.allMyRooms();

                $scope.contaMsgs = function (_room) {
                    return Message.getCountMsgs(_room.room, _room.last);
                };

                $scope.logout = function () {
                    $rootScope.user = null;
                    $rootScope.usuario = null;
                    $state.go('login');
                }
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

                $scope.$on('chatReload', function (data) {
                    scro();
                });

                $scope.sendClick = function () {
                    if ($scope.texto) {
                        Message.addMsg($scope.room, $scope.texto, false);
                        $scope.texto = "";
                    }
                };

                function scro() {
                    $timeout(function () {
                        $ionicScrollDelegate.$getByHandle('mainScroll').scrollBottom();
                    }, 150);
                }

                /**
                 * Camera upload
                 */

                $scope.data = {};
                $scope.obj;
                var pictureSource;   // picture source
                var destinationType; // sets the format of returned value
                var url;

                // on DeviceReady check if already logged in (in our case CODE saved)
                ionic.Platform.ready(function () {
                    if (!navigator.camera) {
                        // error handling
                        return;
                    }
                    //pictureSource=navigator.camera.PictureSourceType.PHOTOLIBRARY;
                    pictureSource = navigator.camera.PictureSourceType.CAMERA;
                    destinationType = navigator.camera.DestinationType.FILE_URI;
                });

                // take picture
                $scope.cameraClick = function () {
                    var options = {
                        quality: 25,
                        destinationType: destinationType,
                        sourceType: pictureSource,
                        encodingType: 0
                    };

                    if (!navigator.camera) {
                        // error handling
                        return;
                    }
                    navigator.camera.getPicture(function (imageURI) {
                        window.plugins.Base64.encodeFile(imageURI, function(base64){
                            if (base64) {
                                Message.addMsg($scope.room, $scope.texto, base64);
                                $scope.texto = "";
                            }
                        });
                    }, function (err) {
                        console.log("got camera error ", err);
                        // error handling camera plugin
                    }, options);
                };

            }
        ]
    )
;
