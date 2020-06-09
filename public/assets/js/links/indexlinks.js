var arraylogo=document.getElementsByClassName("logo");    //link of logos
for(var i of arraylogo){
    i.setAttribute('href','/');
}

try {
    document.getElementById('shopbascket').setAttribute('href','/shopbascket');
} catch (error) {
    
}
try {
    document.getElementById("submitbascket").setAttribute('href','/checkout');
} catch (error) {
    
}
try {
    document.getElementById('signuplink').setAttribute('href','/register');   //register link
} catch (error) {
    
}
try {
    document.getElementById('loginlink').setAttribute('href','/login');       //login link
} catch (error) {
    
}

try {
    document.getElementById("profileview").setAttribute('href',"/profile")
} catch (error) {
    
}
try {
    document.getElementById("aboutus").setAttribute('href','/aboutus');
} catch (error) {
    
}
try {
    document.getElementById("contactus").setAttribute('href','/contactus');
} catch (error) {
    
}






