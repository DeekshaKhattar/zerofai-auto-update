const username = document.querySelector('#username');
username.innerHTML = os.username();
const userMessageInput = document.querySelector('#userMessageInput');
const sendMessage = document.querySelector('#sendMessage');
var chatbox = document.querySelector('#chatbot-ul');
var body = document.querySelector('#chatbox');
var mainmenu = document.querySelector('#mainMenu');
const sender = os.userInfo().username;
let errorClass;
var subjectInput;
var descriptionInput;
var categories = [];
var selected_category;
var selected_subcategory;
var selected_subsubcategory;
var request_type;
let currentSolutionId = null;
UserActions = new Object();
UserActions.username = sender;
UserActions.solution = null;
UserActions.ratings = null;
UserActions.type = null;
UserActions.ticketNumber = null;
UserActions.ticketDescription = null;
UserActions.solutionRun = null;
UserActions.solution_run_id = null;
mainmenu.addEventListener('click', goToMainMenu);
sendMessage.addEventListener('click', sendUserMessage);
let logo = '../../images/chatbot.png';

const notification = document.getElementById('notification');
const message = document.getElementById('message');
const restartButton = document.getElementById('restart-button');

ipcRenderer.on('update_available', ( version) => {
    console.log('update_available', version);
    message.innerText = `New version ${version} available. Downloading...`;
    notification.classList.remove('hidden');
});

ipcRenderer.on('update_downloaded', ( version) => {
    console.log('update_downloaded', version);
    message.innerText = `Version ${version} downloaded. Restart to install update.`;
    restartButton.classList.remove('hidden');
    notification.classList.remove('hidden');
});

ipcRenderer.on('update_error', ( error) => {
    console.log('update_error', error);
    const errorMessage = error || 'Update check failed. Please try again later.';
    message.innerText = `Update status: ${errorMessage}`;
    notification.classList.remove('hidden');
});

ipcRenderer.on('update_status', ( message) => {
    console.log('update_status', message);
    if (!message) {
        console.error("update_status is undefined!");
    }
    notification.innerText = message;
    notification.classList.remove('hidden');
    setTimeout(() => notification.classList.add('hidden'), 3000);
});

function closeNotification() {
    notification.classList.add('hidden');
}
function restartApp() {
    ipcRenderer.send('restart_app');
}

function scrollToBottom() {
    body.scrollTop = body.scrollHeight;
};

let jsonData = null;

ipcRenderer.on('send-json', (data) => {
    // Expecting the data object to have a 'logo' property.
    jsonData = data

    const header = document.querySelector('.header');
    if (header && jsonData.background) {
      header.style.background = jsonData.background;
    }
    const footer_image = document.querySelector('.footer-image');
    if (footer_image && jsonData.footer_logo) {
      footer_image.src = jsonData.footer_logo;
    }

    const footerSpan = document.querySelector('.footer center span');
    if (footerSpan) {
      // Replace the inner HTML with dynamic footer text parts
      // footer_text_1 is for the text before the bold text,
      // footer_text_2 is for the text that should be bold.
      footerSpan.innerHTML = `${jsonData.footer_text_1} <b>${jsonData.footer_text_2}</b>`;
      // Set the text color using footer_text_color from the JSON
      footerSpan.style.color = jsonData.footer_text_color;
    }
  
    // Optionally update the footer image if a logo URL is provided
    const footerImage = document.querySelector('.footer-image');
    if (footerImage && jsonData.footer_logo) {
      footerImage.src = jsonData.footer_logo;
    }

    const mainMenu = document.querySelector('.menuBtn');
    console.log('mainMenu',mainMenu)
    if (mainMenu && jsonData.menu_button_color) {
      mainMenu.style.background = jsonData.menu_button_color;
    }
  });

  ipcRenderer.on('test_event', (message) => {
    console.log("Received test_event:", message);

    // Send a response back to main process
    window.ipcRenderer.send('test_event_response', "Hello from renderer.js!");
});


document.addEventListener('DOMContentLoaded', () => {
    // Bot Starting Message
    const message = 'Hi'
    ipcRenderer.send('send:message', { message, sender })
});

userMessageInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        event.preventDefault();
        let message = userMessageInput.value;
        if (!message) {
            return;
        } else {
            setUserResponse(message);
            ipcRenderer.send('send:message', { message, sender });
        };
    }
});

function removeAllElements() {
    const passwordElements = [
        '#inputPasswordNew',
        '#passwordStrength', 
        '#inputPasswordNewVerify',
        '#passwordMatch'
    ];

    passwordElements.forEach(selector => {
        const element = document.querySelector(selector);
        if (element) element.removeAttribute('id');
    });

    const selectElements = [
        '.category-select',
        '.sub-category-select',
        '.sub-sub-category-select'
    ];
    
    selectElements.forEach(selector => {
        const select = document.querySelector(selector);
        if (select) {
            select.removeAttribute('id');
            select.className = 'form-control';
        }
    });

    const formElements = [
        '#categoryForm',
        '#subCategoryForm', 
        '#subsubcategoryForm',
        '#ticketSubject',
        '#ticketDescription'
    ];

    formElements.forEach(selector => {
        const form = document.querySelector(selector);
        if (form) form.removeAttribute('id');
    });

    const submitButtons = [
        '.categorySubmit',
        '.subcategorySubmit',
        '.subsubcategorySubmit',
        '.feedbackSubmit',
        '.changePasswordSubmit',
        '.subjectSubmit',
        '.descriptionSubmit'
    ];

    submitButtons.forEach(selector => {
        const button = document.querySelector(selector);
        if (button) {
            button.removeAttribute('id');
            button.className = 'btn btn-primary';
        }
    });

    const wrapperElements = [
        '.category_wrapper',
        '.sub_category_wrapper',
        '.sub_sub_category_wrapper',
        '.subjectItem',
        '.descriptionItem',
        '.feedbackItem',
        '.changepassword-item'
    ];

    wrapperElements.forEach(selector => {
        const wrapper = document.querySelector(selector);
        if (wrapper) wrapper.remove();
    });
}

function goToMainMenu(e) {
    currentSolutionId = null;
    const message = 'mainmenu';
    ipcRenderer.send('send:message', { message, sender });
    removeAllElements();
}

function sendUserMessage(e) {
    e.preventDefault();
    let message = userMessageInput.value;
    if (!message) {
        return;
    } else {
        setUserResponse(message);
        ipcRenderer.send('send:message', { message, sender });
    };
};

function buttonSendAction(payload) {
    let userMessage = payload.target.innerHTML;
    setUserResponse(userMessage);
    let message = payload.target.getAttribute('data-payload').split('/')[1];
    ipcRenderer.send('send:message', { message, sender });
}

function setUserResponse(message) {
    var buttons = document.getElementsByClassName('button-renderer');
    if (buttons && buttons[0]) {
        buttons[0].remove();
    };
    var userResponse = `
    <div class="row user-response justify-content-end">
    <li class="row user-response justify-content-end">
        <div class="col-11 user-msg">
            ${message}
        </div>
        <div class="col-1">
            <img class="user-circle-avatar" src="../../images/user.png" />
        </div>
    </div>
    </li>
    `;
    UserActions.solutionRun = message;
    userMessageInput.value = '';
    chatbox.insertAdjacentHTML('beforeEnd', userResponse);
};

ipcRenderer.on('solution:loader', (responseData) => {
    let message = responseData;
    // if(responseData.type=='exe'){
    //     var message = `Please wait while we are installing <b>${responseData.name}</b> for you..!!`;
    // }else{
    //     if (responseData.name.includes('Printer')){
    //         var message = `Please wait while we are fixing your <b>Printer issue</b>..!!`;
    //     }else if(responseData.name.includes('Speed')){
    //         var message = `Please wait while we are <b>Speeding Up</b> your machine..!!`;
    //     }
    //     else{
    //         var message = `Please wait while we are fixing <b>${responseData.name}</b> for you..!!`;
    //     }
    // }
    var loader = `
    <div id="overlay"></div>
    <div id="modal"><h5>${message}</h5><div class="item"><i class="loader --1"></i></div></div>`;
    userMessageInput.disabled = true;
    sendMessage.disabled = true;
    chatbox.insertAdjacentHTML('beforeEnd', loader);
});

ipcRenderer.on('set:solutionId', (id) => {
    currentSolutionId = id;
});

ipcRenderer.on('solution:success', () => {
    document.querySelector('#overlay').remove();
    document.querySelector('#modal').remove();
    userMessageInput.disabled = false;
    sendMessage.disabled = false;
});

ipcRenderer.on('message:loader', () => {
  var botLoader = `
    <li class="row bot-loading justify-content-start">
      <div class="col-1">
        <img class="bot-user-circle" src="${jsonData.logo ? jsonData.logo : logo}" />
      </div>
      <div class="col-11">
        <div class="load-bubble">
          <div class="line"></div>
          <div class="line"></div>
          <div class="line"></div>
        </div>
      </div>
    </li>`;
  chatbox.insertAdjacentHTML('beforeEnd', botLoader);
  scrollToBottom();
});


ipcRenderer.on('message:failed', (messageData) => {
    var loader = document.querySelector('.bot-loading');
    loader.remove();
    errorClass = 'error-msg';
    messageData.forEach(showBotMessage);
    scrollToBottom();
});

ipcRenderer.on('message:success', (messageData) => {
    var loader = document.querySelector('.bot-loading');
    if (loader) {
        loader.remove();
    }
    messageData.forEach(showBotMessage);
    scrollToBottom();
});

function showBotMessage(messageObj) {
    const rasaVariables = ['categories', 'sub-categories', 'solution', 'create_feedback_form', 'create_feedback_success_ticket', 'reportnewincident', 'change_ad_password', 'report-new-service-request'];
    if (messageObj.text && messageObj.text.includes('<id>')) {
        currentSolutionId = null;
        const id = messageObj.text.split('<id>')[1];
        ipcRenderer.send('get:solution', {'id': id});
        UserActions.type = 'autofix';
        UserActions.solution = id;
        UserActions.solution_run_id = null
        setTimeout(() => {
            ipcRenderer.send('create:solutionRunEntry', UserActions);  
        }, 5000);

        return
    };
    if (messageObj.text.includes('<kb>')) {
        UserActions.type = 'kb';
        UserActions.solution_run_id = currentSolutionId;
        messageObj.text = messageObj.text.replace('<kb>', '');
        ipcRenderer.send('create:solutionRunEntry', UserActions);
    }
    if (messageObj['text'] && !rasaVariables.includes(messageObj['text'])) {
        var botResponse = `<li class="row bot-msg justify-content-start">
                                <div class="col-1">
                                    <img class="bot-user-circle" src="${jsonData.logo ? jsonData.logo : logo}" />
                                </div>
                                <div class="col-11 main-msg ${errorClass}">
                                    ${messageObj['text']}
                                </div>
                            </li>`;
        chatbox.insertAdjacentHTML('beforeEnd', botResponse);
    }
    if (messageObj['buttons']) {
        var buttonRendrerStart = `<div class="button-renderer justify-content-start">`
        var buttons = ``
        messageObj['buttons'].forEach((button) => {
            var button = `<button class='btn btn-outline-primary button-spacing solution-btn' data-payload="${button['payload']}" onclick="buttonSendAction(event)">${button['title']}</button>`;
            buttons += button;
        });
        var buttonRendrerEnd = `</div>`
        buttons = buttonRendrerStart + buttons + buttonRendrerEnd;
        chatbox.insertAdjacentHTML('beforeEnd', buttons);
    }
    if (messageObj.text == 'create_feedback_form') {
        // ipcRenderer.send('create:solutionRunEntry', UserActions);
        showFeedback();
    }
    if (messageObj.text == 'change_ad_password') {
        showChangePasswordForm();
        userMessageInput.disabled = true;
        sendMessage.disabled = true;
    }
    if (messageObj.text.includes("The following ticket has been created for you")) {
        UserActions.type = 'ticket';
        const ticketNumberRegex = /<b>Ticket Number<\/b> : (\d+)</;
        const subjectRegex = /<b>Subject<\/b> : (.*?)<br>/;
        const ticketNumber = messageObj.text.match(ticketNumberRegex)[1];
        const subject = messageObj.text.match(subjectRegex)[1];
        UserActions.ticketNumber = ticketNumber;
        UserActions.description = subject;
        ipcRenderer.send('create:TicketEntry', UserActions);
        payload = {
            type : 'ticket',
            solution_run_id : currentSolutionId
        };
        setTimeout(() => {
            ipcRenderer.send('create:solutionRunEntry', payload);   
        }, 3000);

    }
    if (messageObj.text == 'reportnewincident') {
        ipcRenderer.send('get:category', { 'type': 'incident' });
        payload = {
            type : 'ticket',
            solution_run_id : currentSolutionId
        };
        setTimeout(() => {
            ipcRenderer.send('create:solutionRunEntry', payload);   
        }, 3000);
    }
};

function showFeedback() {
    let feedbackForm = `
        <li class="row bot-msg justify-content-start feedbackItem">
            <div class="col-1">
                <img class="bot-user-circle" src="${jsonData.logo ? jsonData.logo : logo}" />
            </div>
            <div class="col-11 main-msg">
                <div class="feedback-container">
                    <div class="feedback-message">
                        <h6>Feels great to work for you!</h6>
                        <h6>Happy to get your feedback for the conversation...</h6>
                    </div>
                    <div class="feedback-range">
                        <div class="inner-content">
                            <input type="radio" name="starRating-2" class="star" id="star1" value="five">
                            <label for="star1"><i class="fa fa-star"></i></label>
                            <input type="radio" name="starRating-2" class="star" id="star2" value="four">
                            <label for="star2"><i class="fa fa-star"></i></label>
                            <input type="radio" name="starRating-2" class="star" id="star3" value="three">
                            <label for="star3"><i class="fa fa-star"></i></label>
                            <input type="radio" name="starRating-2" class="star" id="star4" value="two">
                            <label for="star4"><i class="fa fa-star"></i></label>
                            <input type="radio" name="starRating-2" class="star" id="star5" value="one">
                            <label for="star5"><i class="fa fa-star"></i></label>
                        </div>
                        <center><button type="button" class="btn btn-primary feedbackSubmit" disabled>Submit</button></center>
                    </div>
                </div>
            </div>
        </li>`;
    chatbox.insertAdjacentHTML('beforeEnd', feedbackForm);
    const stars = document.querySelectorAll('.star');
    stars.forEach(star => {
        star.addEventListener('click', onStarClick);
    });
    const feedbackSubmit = document.querySelector('.feedbackSubmit');
    feedbackSubmit.addEventListener('click', onFeedbackSubmit);
    scrollToBottom();
}

function showChangePasswordForm() {
    let changePasswordForm = `
        <li class="row bot-msg justify-content-start changepassword-item">
            <div class="col-1">
                <img class="bot-user-circle" src="${jsonData.logo ? jsonData.logo : logo}" />
            </div>
            <div class="col-11 main-msg">
                <div class="row justify-content-center">
                    <div class="card-outline-secondary">
                        <div class="card-header">
                            <h3 class="mb-0">Change AD Password</h3>
                        </div>
                        <div class="card-body mt-2">
                            <div class="form-group">
                                <b><label for="inputPasswordOld">Current Password</label></b>
                                <input class="form-control" id="inputPasswordOld" required="required" type="password">
                            </div>
                            <div class="form-group">
                                <b><label for="inputPasswordNew">New Password</label></b>
                                <div class="input-password">
                                    <input class="form-control" id="inputPasswordNew" required="required" type="password">
                                    <a href="JavaScript:void(0);" class="icon-view newPassword">
                                        <i class="fa fa-eye-slash"></i>
                                    </a>
                                </div>
                                <small class="form-text text-muted" id="passwordHelpBlock">Your password must be 8-20 characters long, contain letters, numbers, and special characters, and must not contain spaces or emoji.</small>
                            </div>
                            <div class="form-group">
                                <b><label for="inputPasswordNewVerify">Confirm Password</label></b>
                                <div class="input-password">
                                    <input class="form-control" id="inputPasswordNewVerify" required="required" type="password">
                                    <a href="JavaScript:void(0);" class="icon-view confirmPassword">
                                        <i class="fa fa-eye-slash"></i>
                                    </a>
                                </div>
                                <span class="form-text small text-muted">To confirm, type the new password again.</span>
                            </div>
                            <div class="form-group change-password-div mt-2">
                                <button class="btn btn-success btn-lg float-right changePasswordSubmit" type="submit">Save</button>
                            </div>
                            <div id="errorContainer" class="errorContainer d-none">
                                <span style="margin-right: 5px;"><i class="fa fa-exclamation-triangle"></i></span>
                                <span id="errormsg"></span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </li>`;
    chatbox.insertAdjacentHTML('beforeEnd', changePasswordForm);
    const newPassword = document.querySelector('.newPassword');
    newPassword.addEventListener('click', showNewPassword);
    const confirmPassword = document.querySelector('.confirmPassword');
    confirmPassword.addEventListener('click', showConfirmPassword);
    const passwordSubmit = document.querySelector('.changePasswordSubmit');
    passwordSubmit.addEventListener('click', onPasswordSubmit);
    scrollToBottom();
}

function validatePassword(password) {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s])(?!.*[\u{1F300}-\u{1F6FF}])(?!.*\s).{8,20}$/u;
    return regex.test(password);
}

function showNewPassword(e) {
    const passwordInput = document.getElementById('inputPasswordNew');
    const icon = e.target;
    if (icon.classList.contains('fa-eye')) {
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
        passwordInput.setAttribute('type', 'password');
    } else {
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
        passwordInput.setAttribute('type', 'text');
    }
}

function showConfirmPassword(e) {
    const passwordInput = document.getElementById('inputPasswordNewVerify');
    const icon = e.target;
    if (icon.classList.contains('fa-eye')) {
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
        passwordInput.setAttribute('type', 'password');
    } else {
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
        passwordInput.setAttribute('type', 'text');
    }
}

function onPasswordSubmit(e) {
    const oldpassword = document.getElementById('inputPasswordOld').value;
    const newpassword = document.getElementById('inputPasswordNew').value;
    const confirmpassword = document.getElementById('inputPasswordNewVerify').value;
    var errormsg;
    if (!oldpassword || !newpassword || !confirmpassword){
        errormsg = 'Please fill all the required fields.'
    }
    else if (newpassword != confirmpassword){
        errormsg = 'Confirm password is not matching.'
    }
    else if (!validatePassword(newpassword)) {
        errormsg = 'Password does not meet the criteria.'
    }
    if (errormsg) {
        var errorContainer = document.querySelector('#errorContainer');
        if (errorContainer) {
            const errorSpan = document.getElementById('errormsg');
            errorSpan.textContent = errormsg;
            errorContainer.classList.remove('d-none');
        }
    } else {
        ipcRenderer.send('change:password', {oldpassword, newpassword});
        userMessageInput.disabled = false;
        sendMessage.disabled = false;
        const changepasswordform = document.querySelector('.changepassword-item');
        changepasswordform.remove();
    }
}

function onStarClick(e) {
    UserActions.ratings = e.currentTarget.value
    // console.log(e.currentTarget.value)
    document.querySelector('.feedbackSubmit').removeAttribute("disabled");
}

function onFeedbackSubmit(e) {
    var feedbackItem = document.querySelector('.feedbackItem');
    feedbackItem.remove();
    ipcRenderer.send('create:feedback', UserActions);
}

ipcRenderer.on('change-password-failed', (data) => {
    const subject = "Change windows password."
    const description = "Unable to change windows password using chatbot."
    ipcRenderer.send('generate:ticket', { subject, description });
})

ipcRenderer.on('renderTicket:subject', () => {
    var loader = document.querySelector('.bot-loading');
    if (loader) {
        loader.remove();
    };
    var subBody = `
        <li class="row bot-msg justify-content-start subjectItem">
            <div class="col-1">
                <img class="bot-user-circle" src="${jsonData.logo ? jsonData.logo : logo}" />
            </div>
            <div class="col-11 main-msg ${errorClass}">
                <span>What's the issue regarding about?</span>
                <div class="input-group">
                    <span class="input-group-text">Subject</span>
                    <input type="text" class="form-control" aria-label="Subject" id="ticketSubject" required pattern=".*\S+.*">
                </div>
                <div id="errorContainer" class="errorContainer d-none">
                    <span style="margin-right: 5px;"><i class="fa fa-exclamation-triangle"></i></span>
                    <span> </span>
                </div>
                <div class="submitBox">
                    <button type="button" class="btn btn-primary subjectSubmit">Submit</button>
                </div>
            </div>
        </li>`;
    chatbox.insertAdjacentHTML('beforeEnd', subBody);
    subjectInput = document.querySelector('#ticketSubject');
    const subjectSubmit = document.querySelector('.subjectSubmit');
    subjectSubmit.addEventListener('click', submitSubject);
    scrollToBottom();
});

function submitSubject(e) {
    e.preventDefault();
    let subject = subjectInput.value;
    if (!subject) {
        var errorContainer = document.querySelector('#errorContainer');
        if (errorContainer) {
            const spans = errorContainer.getElementsByTagName('span');
            if (spans.length > 0) {
                const lastSpan = spans[spans.length - 1];
                lastSpan.textContent = 'Please enter a subject for the issue.';
            }
            errorContainer.classList.remove('d-none');
        }
    } else {
        localStorage.setItem('subject', subject)
        var renderSavedSubject = {
            'text': `<b>Ticket Subject:</b> ${subject}`,
        };
        showBotMessage(renderSavedSubject);
        var subjectItem = document.querySelector('.subjectItem');
        subjectItem.remove();
        renderDescription();
    };
};

function renderDescription() {
    var descriptionBody = `
        <li class="row bot-msg justify-content-start descriptionItem">
            <div class="col-1">
                <img class="bot-user-circle" src="${jsonData.logo ? jsonData.logo : logo}" />
            </div>
            <div class="col-11 main-msg ${errorClass}">
                <span>Describe your issue.</span>
                <div class="input-group">
                    <span class="input-group-text">Description</span>
                    <input type="text" class="form-control" aria-label="Description" id="ticketDescription" required pattern=".*\S+.*">
                </div>
                <div id="errorContainer" class="errorContainer d-none">
                    <span style="margin-right: 5px;"><i class="fa fa-exclamation-triangle"></i></span>
                    <span> </span>
                </div>
                <div class="submitBox">
                    <button type="button" class="btn btn-primary descriptionSubmit">Submit</button>
                </div>
            </div>
        </li>`
    chatbox.insertAdjacentHTML('beforeEnd', descriptionBody);
    descriptionInput = document.querySelector('#ticketDescription');
    const descriptionSubmit = document.querySelector('.descriptionSubmit');
    descriptionSubmit.addEventListener('click', submitDescription);
    scrollToBottom();
};

function submitDescription(e) {
    e.preventDefault();
    let description = descriptionInput.value;
    if (!description) {
        var errorContainer = document.querySelector('#errorContainer');
        if (errorContainer) {
            const spans = errorContainer.getElementsByTagName('span');
            if (spans.length > 0) {
                const lastSpan = spans[spans.length - 1];
                lastSpan.textContent = 'Please enter a description for the issue.';
            }
            errorContainer.classList.remove('d-none');
        }
    } else {
        localStorage.setItem('description', description)
        var renderSavedDescription = {
            'text': `<b>Ticket Description:</b> ${description}`,
        };
        showBotMessage(renderSavedDescription);
        var descriptionItem = document.querySelector('.descriptionItem');
        descriptionItem.remove();
        const subject = localStorage.getItem('subject');
        localStorage.removeItem('subject');
        localStorage.removeItem('description');
        ipcRenderer.send('generate:ticket', { subject, description });
    };
};

// Render created ticket data
ipcRenderer.on('ticketCreation:success', (messageData) => {
    var loader = document.querySelector('.bot-loading');
    if (loader) {
        loader.remove();
    }
    var ticketDetail =`
    <li class="row bot-msg justify-content-start">
        <div class="col-1">
            <img class="bot-user-circle" src="${jsonData.logo ? jsonData.logo : logo}" />
        </div>
        <div class="col-11 main-msg ${errorClass}">
            <b>The following ticket has been created for you:</b><br><br>
            <b>Ticket Number</b> : ${messageData.request.id}<br>
            <b>Priority</b> : ${messageData.request.priority.name}<br>
            <b>Subject</b> : ${messageData.request.subject}<br>
            <b>Engineer will address your ticket no later than <b>${messageData.request.first_response_due_by_time.display_value}</b>
        </div>
    </li>`;
    chatbox.insertAdjacentHTML('beforeEnd', ticketDetail);
    UserActions.ticketNumber = messageData.request.id;
    UserActions.description = messageData.request.subject
    ipcRenderer.send('create:TicketEntry', UserActions);
    scrollToBottom();
});
