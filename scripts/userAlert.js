/**
 * Created by SFraungruber on 24.06.2015.
 */

var user = [false, false, false]
function set_alert(index){
    user[index] = true;
    if(user[0] && user[1] && user[2]){
        alert("Lassen sie sich nicht aufhalten!");
        user = [false, false, false];
    }
}

function register_user_listener(id,index){
    document.getElementById(id).addEventListener('click', function() {
        set_alert(index);
    }, false);

}
$(document).ready(function(){
    register_user_listener("picu1", 0);
    register_user_listener("picu2", 1);
    register_user_listener("picu3", 2);
});
