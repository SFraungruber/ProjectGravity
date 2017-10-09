/**
 * Created by SFraungruber on 21.05.2015.
 */


// convert the JSONs
function JSONparse(json){
    json = json.replace(/;/g, '"');
    return JSON.parse(json);
}
function JSONstringify(object){
    var json = JSON.stringify(object);
    return json.replace(/"/g, ';');
}