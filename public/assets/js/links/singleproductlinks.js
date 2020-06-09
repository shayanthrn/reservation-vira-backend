var a=window.location.href;
var productaddlink=a.split("/");
document.getElementById("addtobascket").setAttribute('href',"addtobascket/"+productaddlink[4]);