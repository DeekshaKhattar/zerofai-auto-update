
const loginForm = document.querySelector('#login-form');
const username = document.querySelector("#username");
const password = document.querySelector("#password");

function loginFormSubmit(e) {
    e.preventDefault();
    if (!username.value){
        alertError('Please enter your username');
        return;
    }
    if (!password.value){
        alertError('Please enter your password');
        return;
    }
    const name = username.value;
    const pass = password.value;
    ipcRenderer.send('login:submit', {name, pass});
}

ipcRenderer.on('login:success', () => {
    alertSuccess('Login Successfully');
})
ipcRenderer.on('login:failed', (message) => {
    alertSuccess(message);
})

function alertError(message){
    Toastify.toast({
        text: message,
        duration: 5000,
        close: false,
        style: {
            background: 'red',
            color: 'white',
            textAlign: 'center'
        }
    });
}

function alertSuccess(message){
    Toastify.toast({
        text: message,
        duration: 5000,
        close: false,
        style: {
            background: 'green',
            color: 'white',
            textAlign: 'center'
        }
    });
}

loginForm.addEventListener('submit', loginFormSubmit);
