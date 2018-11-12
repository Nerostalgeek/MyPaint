/**
 * IIFE (https://toddmotto.com/what-function-window-document-undefined-iife-really-means/)
 * Sans cela, toutes les variables et fonctions sont global et risque d'etre écrasée
 */
(function (window, document, undefined) {
    //'use strict';
    var that = this;

    /**
     * Initialise le paint
     */
    this.init = function () {
        this.DOM = {
            canvas: $('#canvas'),
            copyCanvas: $('#canvas--copy'),
            color: $('#thecolors')
        };

        this.currentTool = null;

        this.tools = {
            draw: {
                DOM: $('#draw'),
                callMe: this.bindDrawEvent
            },
            line: {
                DOM: $('#line'),
                callMe: this.bindLineEvent
            },
            rect: {
                DOM: $('#rectangle'),
                callMe: this.bindRectEvent
            },
            circle: {
                DOM: $('#circle'),
                callMe: this.bindCircleEvent
            },
            elipse: {
                DOM: $('#elipse'),
                callMe: this.bindElipseEvent
            },
            square: {
                DOM: $('#square'),
                callMe: this.bindSquareEvent
            },
            file: {
                DOM: $('#file'),
                callMe: this.openFile
            },
            eraser: {
                DOM: $('#eraser'),
                callMe: this.bindEraserEvent
            }
        };

        this.symmetric = {
            DOM: $('#symmetric'),
            callMeFirst: this.startSymmetric,
            callMeMaybe: this.endSymmetric,
            state: false
        };

        this.position = {
            x: 0,
            y: 0,
            simX: 0,
            simY: 0
        };

        this.DOM.canvas.attr({
            height: this.DOM.canvas.height(),
            width: this.DOM.canvas.width()
        });

        this.DOM.copyCanvas.attr({
            height: this.DOM.copyCanvas.height(),
            width: this.DOM.copyCanvas.width()
        });

        this.context = this.DOM.canvas.get(0).getContext('2d');
        this.copyContext = this.DOM.copyCanvas.get(0).getContext('2d');

        this.bindToolbarEvent();

        this.tools.draw.DOM.trigger('click');


        this.DOM.color.on('change', $.proxy(this.changeColor, this));
    };

    /**
     * Catch le click pour envoie photo
     */
    this.triggerClick = function(){
            $("#file" ).trigger( "click" );

    };
    /**
     * Détruit les évènements sur le canvas
     */
    this.destroyCanvasEvent = function () {
        this.DOM.copyCanvas.css('z-index', '1').off('mouseup').off('mousedown').off('mousemove');
        this.DOM.canvas.off('mouseup').off('mousedown').off('mousemove');
    };

    /**
     * Binding click sur chaque outils pour changer
     */
    this.bindToolbarEvent = function () {
        Object.keys(this.tools).map(function (tool) {
            that.tools[tool].DOM.on('click', function () {
                that.destroyCanvasEvent();

                that.tools[tool].callMe();

                that.currentTool = tool;

                console.log('Changement pour ====> ' + that.currentTool);
            });
        });

        this.symmetric.DOM.on('click', function() {

           if (that.symmetric.state) {
               // A désactivé
               that.symmetric.state = false;
               $('#helper--symmetric').remove();

               // Ici tu debind ce que t'as besoin

           } else {
               // A activé
               that.symmetric.state = true;

               that.tools.draw.DOM.trigger('click');

               that.halfCanvas = that.DOM.copyCanvas.width() / 2;
               that.heightOfDiv = that.DOM.copyCanvas.height();

               $('<div id="helper--symmetric" style="position: absolute; top: 1px; left: ' + that.halfCanvas + 'px; ' + 'display: inline; border: 1px solid black; width: 1px; height: ' + that.DOM.copyCanvas.height() + 'px;"></div>').prependTo('#canvas--container');
           }
            console.log(that.symmetric.state);
        });
    };

    /**
     * Remplis le canvas de couleur
     */
    this.fillCanvas = function () {
        this.context.fillStyle = that.DOM.color.val();
        this.context.fillRect(0, 0, this.DOM.canvas.width(), this.DOM.canvas.height());
    };

    /**
     * Change le style de trait
     * @param brush
     */
    this.changeBrushStyle = function (brush) {
        this.copyContext.lineCap = brush;
    };

    /**
     * Change la largeur de ligne
     * @param width
     */
    this.changeBrushSize = function (width) {
        this.copyContext.lineWidth = parseInt(width, 10);
    };

    /**
     * Change la couleur
     */
    this.changeColor = function (ev) {
        this.copyContext.strokeStyle = that.DOM.color.val();
    };

    /**
     * Efface le canvas
     */
    this.clearCanvas = function () {
        this.context.clearRect(0, 0, this.DOM.canvas.width(), this.DOM.canvas.height());
    };
    /**
     * Gomme
     */
    this.bindEraserEvent = function() {
        that.DOM.copyCanvas.css('z-index', '-1');

        that.DOM.canvas
            .on('mouseup', function () {
                that.DOM.canvas.off('mousemove').on('mousemove', $.proxy(that.getCursorPosition, that));
            })
            .on('mousemove', $.proxy(that.getCursorPosition, that))
            .on('mousedown', function () {
                that.context.beginPath();
                that.context.moveTo(that.position.x, that.position.y);

                that.DOM.canvas.on('mousemove', function () {
                    that.context.save();
                    that.context.globalCompositeOperation = 'destination-out';
                    that.context.globalAlpha = 0.5;
                    that.context.fillStyle = 'rgba(0,0,0,1)';
                    that.context.lineWidth = 35;

                    that.context.lineTo(that.position.x, that.position.y);

                    that.context.stroke();
                    that.context.restore();
                });
            });
    };

    /**
     * Dessine avec le crayon
     */
    this.bindDrawEvent = function () {
       console.log(that.symmetric.state);
            that.DOM.copyCanvas
                .on('mouseup', function () {
                    that.DOM.copyCanvas.off('mousemove').on('mousemove', $.proxy(that.getCursorPosition, that));

                    that.reallyDraw();
                })
                .on('mousemove', $.proxy(that.getCursorPosition, that))
                .on('mousedown', function (e) {
                    that.copyContext.beginPath();
                    that.copyContext.moveTo(that.position.x, that.position.y);

                    if (that.symmetric.state) {
                        that.context.strokeStyle = that.DOM.color.val();
                        that.context.beginPath();

                        that.context.moveTo(that.position.symX, that.position.symY);
                    }

                    that.DOM.copyCanvas.on('mousemove', function () {
                        that.copyContext.lineTo(that.position.x, that.position.y);
                        that.copyContext.stroke();

                        if (that.symmetric.state) {
                            that.context.lineTo(that.position.symX, that.position.symY);
                            that.context.stroke();
                        }

                    });
                });
    };

    this.bindLineEvent = function () {
        that.started = false;

        that.DOM.copyCanvas
            .on('mousedown', function (ev) {
                that.started = true;
                that.position.x = ev.offsetX;
                that.position.y = ev.offsetY;
            }).on('mousemove', function (ev) {
            if (!that.started) {
                return;
            }
            that.drawLine(ev);
        }).on('mouseup', function (ev) {
            if (that.started) {
                that.drawLine(ev);
                that.started = false;
                that.reallyDraw();

            }
        });

    };

    this.drawLine = function (ev) {
        that.copyContext.clearRect(0, 0, that.DOM.copyCanvas.width(), that.DOM.copyCanvas.height());

        copyContext.beginPath();
        copyContext.moveTo(that.position.x, that.position.y);
        copyContext.lineTo(ev.offsetX, ev.offsetY);
        copyContext.stroke();
        copyContext.closePath();
    };

    /**
     * Dessie un carré
     */
    this.bindSquareEvent = function(){
        that.started = false;

        that.DOM.copyCanvas.on('mousedown', function (ev) {
            that.started = true;
            that.getCursorPosition(ev);
        }).on('mousemove', function(ev) {
            that.drawSquare(ev);
        }).on('mouseup', function (ev) {
            if(that.started){
                that.drawSquare(ev);
                that.reallyDraw();
                that.started = false;
            }
        });
    };

    this.drawSquare = function(ev){
        if(!that.started) return;

        var x = Math.min(ev.offsetX, that.position.x),
            y = Math.min(ev.offsetY, that.position.y),
            w = Math.abs(ev.offsetX - that.position.x * that.position.x / that.position.x),
            h = w;

        that.copyContext.clearRect(0, 0, that.DOM.copyCanvas.width(), that.DOM.copyCanvas.height());

        if (!w || !h) return;

        that.copyContext.strokeRect(x, y, w, h);
    };

    /**
     * Dessine un rectangle
     */
    this.bindRectEvent = function () {
        that.started = false;

        that.DOM.copyCanvas.on('mousedown', function (ev) {
            that.started = true;

            that.getCursorPosition(ev);
        }).on('mousemove', function (ev) {
            that.drawRectangle(ev);
        }).on('mouseup', function (ev) {
            if (that.started) {
                that.drawRectangle(ev);

                that.reallyDraw();

                that.started = false;
            }
        });
    };

    this.drawRectangle = function (ev) {
        if (!that.started) return;

        var x = Math.min(ev.offsetX, that.position.x),
            y = Math.min(ev.offsetY, that.position.y),
            w = Math.abs(ev.offsetX - that.position.x),
            h = Math.abs(ev.offsetY - that.position.y);

        that.copyContext.clearRect(0, 0, that.DOM.copyCanvas.width(), that.DOM.copyCanvas.height());

        if (!w || !h) return;

        that.copyContext.strokeRect(x, y, w, h);
    };

    /**
     * Dessine un cercle
     */
    this.bindCircleEvent = function () {

        that.started = false;

        that.DOM.copyCanvas.on('mousedown', function (ev) {
            that.started = true;

            that.getCursorPosition(ev);
        }).on('mousemove', function (ev) {
            that.drawCircle(ev);
        }).on('mouseup', function (ev) {
            if (that.started) {
                that.drawCircle(ev);

                that.reallyDraw();

                that.started = false;
            }
        });
    };

    this.drawCircle = function (ev) {
        if (!that.started) return;

        copyContext.beginPath();

        //Draw a circle around a mouse click
        //ctx.arc(x-position, y-position, radius, start-angle, end-angle);
        copyContext.arc(position.x, position.y, 30, 0, 2 * Math.PI);
        copyContext.stroke();
    };

    /**
     * Dessine une elipse
     */
    this.bindElipseEvent = function () {

        that.started = false;

        var x1, y1;

        that.DOM.copyCanvas.on('mousedown', function(e) {
            var rect = that.DOM.copyCanvas.get(0).getBoundingClientRect();
            x1 = e.clientX - rect.left;
            y1 = e.clientY - rect.top;

            that.started = true;
        }).on('mouseup', function() {
            that.started = false;
            that.reallyDraw();
        }).on('mousemove', function(e) {
            if (!that.started) return;

            var rect = that.DOM.copyCanvas.get(0).getBoundingClientRect(),
                x2 = e.clientX - rect.left,
                y2 = e.clientY - rect.top;

            that.copyContext.clearRect(0, 0, that.DOM.copyCanvas.width(), that.DOM.copyCanvas.height());
            that.drawElipse(x1, y1, x2, y2);

        });
    };

    this.drawElipse = function(x1, y1, x2, y2){
        var radiusX = (x2 - x1) * 0.5,
            radiusY = (y2 - y1) * 0.5,
            centerX = x1 + radiusX,
            centerY = y1 + radiusY,
            step = 0.01,
            a = step,
            pi2 = Math.PI * 2 - step;

        copyContext.beginPath();
        copyContext.moveTo(centerX + radiusX * Math.cos(0),
            centerY + radiusY * Math.sin(0));

        for(; a < pi2; a += step) {
            copyContext.lineTo(centerX + radiusX * Math.cos(a),
                centerY + radiusY * Math.sin(a));
        }
        copyContext.closePath();
        copyContext.strokeStyle = '#000';
        copyContext.stroke();
    };

    /**
     * Ouvre une image
     */
    this.openFile = function() {
        $('#file').on('change', function (ev) {
            clearCanvas();
            var URL = URL || webkitURL;
            var temp = URL.createObjectURL(ev.target.files[0]);
            var image = new Image();
            image.src = temp;

            $(image).on('load', function () {
               var imageWidth = image.naturalWidth;
                var imageHeight = image.naturalHeight;
                var  newImageWidth = imageWidth;
                var  newImageHeight = imageHeight;
                var  originalImageRatio = imageWidth / imageHeight;

                if (newImageWidth > newImageHeight && newImageWidth > 800) {
                    newImageWidth = 800;
                    newImageHeight = 800 / originalImageRatio;
                }

                if ((newImageWidth >= newImageHeight || newImageHeight > newImageWidth) && newImageHeight > 500) {
                    newImageHeight = 500;
                    newImageWidth = 500 * originalImageRatio;
                }


                context.drawImage(image, 0, 0, newImageWidth, newImageHeight);
                URL.revokeObjectURL(temp); //release the object from cache
            });
        });
    };
    /**
     * Donne la position du curseur en JavaScript pûr
     * @param e
     */


    this.getCursorPosition = function (e) {
        that.halfCanvas = that.DOM.copyCanvas.width() / 2;

        that.position.x = e.pageX - that.DOM.copyCanvas.offset().left;
        that.position.y = e.pageY - that.DOM.copyCanvas.offset().top;

        if (that.symmetric.state) {
            that.halfCanvas = that.DOM.copyCanvas.width() / 2;

            that.position.symX = e.pageX - that.DOM.copyCanvas.offset().left + (2 * (that.halfCanvas - (e.pageX - that.DOM.copyCanvas.offset().left)));
            that.position.symY = e.pageY - that.DOM.copyCanvas.offset().top;
        }
    };

    this.reallyDraw = function () {
        this.context.drawImage(this.DOM.copyCanvas.get(0), 0, 0);
        this.copyContext.clearRect(0, 0, this.DOM.copyCanvas.width(), this.DOM.copyCanvas.height());
    };

    this.init();
})(window, document);
