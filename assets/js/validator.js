function Validator(formSelector, options = {}) {
    function getParent(element, selector) {
        while(element.parentElement) {
            if(element.parentElement.matches(selector)) {
                return element.parentElement;
            }
            element = element.parentElement;
        }
    }

    var formRules = {};

    /**
     * Quy ước tạo rule
     * - Có lỗi => `error message`
     * - Không lỗi => `undefinded`
     */
    var validatorRules = {
        required: function(value) {
            return value ? undefined : 'Trường này không được trống!';
        },
        email: function(value) {
            var regex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
            return regex.test(value) ? undefined : 'Email không đúng định dạng!';
        },
        min: function(min) {
            return function(value) {
                return value.length >= min ? undefined : `Trường này nhập tối thiểu ${min} ký tự!`;
            }
        },
        max: function(max) {
            return function(value) {
                return value.length <= max ? undefined : `Trường này nhập tối đa ${max} ký tự!`;
            }
        }
    }

    // Lấy ra form elm trong DOM theo `formSelector`
    var formElement = document.querySelector(formSelector);

    // Chỉ xử lý khi elm tồn tại trong DOM
    if(formElement) {
        // Lấy tất cả input trong form
        var inputs = formElement.querySelectorAll('[name][rules]');
        // Duyệt qua để lấy name, rules
        for(var input of inputs) {
            // Tách giá trị của rules ra thành mảng required|min|max
            var rules = input.getAttribute('rules').split('|');
            for(var rule of rules) {
                var ruleInfo;
                var isRuleHasValue = rule.includes(':');
                
                if(isRuleHasValue) {
                    ruleInfo = rule.split(':');
                    rule = ruleInfo[0]; // [0]: min; [1]: max
                }

                var ruleFunc = validatorRules[rule];

                if(isRuleHasValue) {
                    ruleFunc = ruleFunc(ruleInfo[1]);
                }

                // Lưu các validatorRules cho obj formRules
                if(Array.isArray(formRules[input.name])) {
                    // Lần thứ 2 trở đi
                    formRules[input.name].push(ruleFunc);
                } else {
                    // Lần thứ nhất
                    formRules[input.name] = [ruleFunc];
                }
            }

            // Lắng nghe sự kiện (blur, onchange)
            input.onblur = handleValidate;
            input.oninput = handleClearError;
        }

        // Hàm show lỗi
        function handleValidate(e) {
            var rules = formRules[e.target.name];
            var errorMessage;

            rules.find(function(rule) {
                errorMessage = rule(e.target.value);
                return errorMessage;
            });

            // Nếu có lỗi thì hiển thị ra UI
            if(errorMessage) {
                var formGroup = getParent(e.target, '.form-group');
                
                if(formGroup) {
                    formGroup.classList.add('invalid');
                    var formMessage = formGroup.querySelector('.form-message');
                    if(formMessage) {
                        formMessage.innerText = errorMessage;
                    }
                }
            }

            return !errorMessage;
        }

        // Hàm clear message lỗi
        function handleClearError(e) {
            var formGroup = getParent(e.target, '.form-group');

            if(formGroup.classList.contains('invalid')) {
                formGroup.classList.remove('invalid');

                var formMessage = formGroup.querySelector('.form-message');
                if(formMessage) {
                    formMessage.innerText = '';
                }
            }
        }
    }

    // Xử lý hành vi submit form
    formElement.onsubmit = function(e) {
        e.preventDefault();

        var inputs = formElement.querySelectorAll('[name][rules]');
        var isValid = true;

        for(var input of inputs) {
            if(!handleValidate({ target: input })) {
                isValid = false;
            }
        }

        // Khi không có lỗi thì submit form
        if(isValid) {
            if(typeof options.onSubmit === 'function') {
                var enableInputs = formElement.querySelectorAll('[name]'); 
                var formValues = Array.from(enableInputs).reduce(function(values, input) {
                    switch(input.type) {
                        case 'radio':
                            values[input.name] = formElm.querySelector('input[name="'+ input.name +'"]:checked').value;
                            break;
                        case 'checkbox':
                            if(!input.matches(':checked')) {
                                values[input.name] = '';
                                return values;
                            }

                            if(!Array.isArray(values[input.name])) {
                                values[input.name] = [];
                            }

                            values[input.name].push(input.value);
                            
                            break;
                        case 'file':
                            values[input.name] = input.files;
                            break;
                        default:
                            values[input.name] = input.value;
                    }
                    return values;
                }, {});

                // gọi lại hàm onsubmit và trả kết quả về
                options.onSubmit(formValues);
            } else {
                formElement.submit();
            }
        }
    }
}