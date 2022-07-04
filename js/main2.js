
var orderValidator = new FormValidator();


(function($) {

    window.addEventListener('DOMContentLoaded', function() {

        var interPhoneCodes = null;
        if (typeof jQuery.fn.mask === 'undefined') {
            interPhoneCodes = new InterPhoneCodes();

            var forms = document.querySelectorAll('form');
            forms.forEach(function(form) {
                try {
                    var input = form.elements.phone;
                    var select = form.elements.offer;

                    country = window.app.currentOffer.country.code

                    if (interPhoneCodes.defaultDirectionCountry.indexOf(country) !== -1) {
                        input.setAttribute('dir', 'ltr');
                        input.setAttribute('style', 'direction:ltr');
                    }

                    if (!input || !select) {
                        throw new Error('form element not found');
                    }
                    interPhoneCodes.countryCodeHandler(input, select);
                } catch(e) {
                    console.error(e.stack);
                }
            });
        }

        /*
         * Some typical form actions
         */
        set_validator_errors();
        orderValidator.addRule('name', orderValidator.errorNameField, 'length', {minlength: 2});
        orderValidator.addRule('phone', orderValidator.errorPhoneField, 'phone', {interPhoneCodes: interPhoneCodes});

        orderValidator.addMessages('name', {required: orderValidator.errorNameMess, minlength: orderValidator.errorNameMess});
        orderValidator.addMessages('phone', {phone: orderValidator.errorPhoneMess});

        orderValidator.addRule('other\[email\]', orderValidator.errorEmailField, 'email');
        orderValidator.addMessages('other\[email\]', {email: orderValidator.errorEmail});

        orderValidator.addRule('email', orderValidator.errorEmailField, 'email');
        orderValidator.addMessages('email', {email: orderValidator.errorEmail});

        orderValidator.watch('form:not(.novalidate, .notorder)');
    });

    $(document).on('keyup keydown click input', 'form:not(.novalidate, .notorder)', function (e) {
        var form = e.currentTarget;
        var copyFields = ['name', 'phone', 'offer'];
        for (var i = 0; i < copyFields.length; ++i) {
            var fieldName = copyFields[i];

            var formElement = $(this).find('[name=' + fieldName + ']');
            var siblingInputs = $('form').not(form).find('[name=' + fieldName + ']');

            var value = formElement.val();
            siblingInputs.val(value);

            if (fieldName === 'phone') {
                var placeholder = formElement.attr('placeholder');
                siblingInputs.attr('placeholder', placeholder);
            }
        }
    });

    /*
    * General code for highlighting fields
    */
    $(document).on('validate.valid validate.error', 'form', function(e) {
    
        var validator = e.validator;
    
        var highlight = {
            
            error: function(element, errors) {
                var el = $(element);
                var parent = el.parent();
                var label = parent.find('label');
                parent.find('.error-container').html(errors[0]).show();
                $.each([el, parent, label], function() {
                    if ($(this).is('form')) {
                        return;
                    }
                    $(this).removeClass('field-valid').addClass('field-error');
                });
            },
            
            valid: function(element) {
                var el = $(element), parent = el.parent(), label = parent.find('label');
                $(element).parent().find('.error-container').empty().hide();
                $.each([el, parent, label], function() {
                    if ($(this).is('form')) {
                        return;
                    }
                    $(this).addClass('field-valid').removeClass('field-error');
                });
            }
        }
        
        for (var field in validator.rules) {
            if (field !== 'other[email]') {
                var element = $(this).find('[name=' + field + ']').get(0);
                if (validator.errors[field].length) {
                    highlight.error(element, validator.errors[field]);
                } else {
                    highlight.valid(element);
                }
            }
        }
    
    });

    function setTimestamps(form) {
            
        function _zero_padded_num(n) {
            return n > 9 ? n : '0' + n;
        }
        
        var d = new Date();
        var month = _zero_padded_num(d.getMonth()+1);
        var day = _zero_padded_num(d.getDate());
        var hour = _zero_padded_num(d.getHours());
        var minutes = _zero_padded_num(d.getMinutes());
        var seconds = _zero_padded_num(d.getSeconds());
        var ds = d.getFullYear() +'-'+ month + '-' + day + 'T' + hour + ':' + minutes + ':' + seconds;
        $(form).find('[name=local_time]').val(ds);
    }


    function fixForm(form) {
        
        form = $(form);

        form.on('submit', function( e ){
            // Блокируем кнопки при отправке формы
            app.blockForm();

        });
        
        function _fieldExists(form, fieldName) {
            return Boolean(form.find('input[name=' + fieldName + '], select[name=' + fieldName + ']').length);
        }
        
        function _setField(form, fieldName, value) {
            value = value || '';
            if (!_fieldExists(form, fieldName)) {
                var el = $('<input type="hidden" name="' + fieldName + '" value="">');
                el.val(value);
                form.prepend(el);
            }
        }
        
        if (!_fieldExists(form, 'phone')) {
            return ;
        }
        
        if (!_fieldExists(form, 'lead_token')) {
        
            form.prop('action', app.formAction);
            form.attr('action', app.formAction);
            form.attr('autocomplete', 'on');
            form.find('[name=name]').attr('autocomplete', 'name');
            form.find('[name=phone]').attr('autocomplete', 'tel');
            form.find('[name=name]').attr('autocomplete', 'name').attr("required", 'required');
            form.find('[name=phone]').attr('autocomplete', 'tel').attr("required", 'required');
            
            // _setField(form, 'lllead');
            _setField(form, 'offer', app.currentOffer.id);
            _setField(form, 'country', '');
            _setField(form, 'lead_token', app.leadToken);
            _setField(form, 'local_time');
            _setField(form, 'timezone_int');
            _setField(form, 'visit_duration1');
            _setField(form, 'visit_duration2');
            _setField(form, 'code_confirm');
            _setField(form, 'stream_hid', app.streamHid);
        }
        
        if (form.find('select[name=offer]').length) {
            $(form).find('[name=country]').val(app.currentOffer && app.currentOffer.country.code);
        } else {
            $(form).find('[name=country]').remove();
        }
        
        var d = new Date(), tz = d.getTimezoneOffset() / -60, visitDuration = parseInt(d.getTime()/1000 - app.timestamp);
        $(form).find('input[name=timezone_int]').val(tz); 
        $(form).find('input[name=visit_duration1]').val(visitDuration);
        
        // setTimestamps(form);
    }

    function fixAllForms() {
        $('form').each(function(idx, form) { 
            fixForm(form);
        });
    }
    setInterval(fixAllForms, 1000);
    
    $(document).on('focus', 'form', function(e) {
        fixForm(this);
    });

    $(document).on('change input', 'select[name=offer]', function(e) {
        app.setOffer(this.value);
        app.unblockForm();
    });
    
    $(document).on('keyup click change input', 'form', function() {
        app.incompleteOrder.processForm(this);
    });

    $(document).on('validate.success', 'form', function(e) {
        if(e.submitEvent) {
            app.incompleteOrder.lock = true;
            clearTimeout(app.incompleteOrder.timer);
        }
    });

    // if(app.showcaseUrl) {
    //     var showcaseUrl = app.showcaseUrl;
    //     if (showcaseUrl.indexOf('http') !== 0) {
    //         showcaseUrl = 'http://' + showcaseUrl;
    //     }
    //
    //     history.replaceState(null, document.title, location.pathname + location.search + "#!/");
    //     history.pushState(null, document.title, location.pathname + location.search);
    //
    //     window.addEventListener("popstate", function() {
    //         if(location.hash === "#!/") {
    //             history.replaceState(null, document.title, location.pathname + location.search);
    //             setTimeout(function(){
    //                 location.replace(showcaseUrl);
    //             }, 0);
    //         }
    //     }, false);
    // }

    if (app.showcaseUrl) {
        document.addEventListener('DOMContentLoaded', function() {
            window.vitBack(app.showcaseUrl, true);
        })
    }

})(app.jq);
