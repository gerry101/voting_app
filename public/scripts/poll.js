$(document).ready(function() {
    var max_fields      = 10; 
    var wrapper         = $(".input_fields_wrap"); 
    var add_button      = $(".add_field_button"); 
    
    var x = 1; 
    $(add_button).click(function(e){ 
        e.preventDefault();
        if(x < max_fields){ 
            x++; 
            $(wrapper).append('<div><input type="text" class="form-control mt-1" placeholder="poll option" name="option[]"/><a href="#" class="remove_field">Remove</a></div>'); 
        }
    });
    
    $(wrapper).on("click",".remove_field", function(e){ 
        e.preventDefault(); $(this).parent('div').remove(); x--;
    })
    
    $.validator.setDefaults ({
       
       highlight: function(element) {
            $(element)
                .closest(".form-group")
                .addClass("has-danger");
        },
       unhighlight: function(element) {
            $(element)
                .closest(".form-group")
                .removeClass("has-danger");
        },
       errorPlacement: function(error, element) {
           if(element.prop("type") === "password" || "text") {
               error.insertAfter(element.parent());
           }
       }
   });   
    
   $("#new-poll").validate({
      rules: {
          title: {
              required: true
          },
          'option[]': {
              required: true,
          }
      },
      messages: {
          title: {
              required: "Please provide a poll title"
          },
          'option[]': {
              required: "A poll option is required here"
          }
      }
   }); 
});