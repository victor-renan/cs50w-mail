document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox')
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';

  // Send the Email
  document.querySelector("#compose-form").addEventListener('submit', function(event) {
    event.preventDefault();
    // * Write the data via POST
    fetch("/emails", {
      method: 'POST',
      body: JSON.stringify({
        recipients: document.querySelector("#compose-recipients").value,
        subject: document.querySelector("#compose-subject").value,
        body: document.querySelector("#compose-body").value
      })
    })
    .then(response => response.json())
    .then(result => {
      console.log(result);
    })
    setTimeout(function() {load_mailbox('sent');}, 5);
  });
}

function showEmailContent(email, btnCondition) {

  //Show the email-content view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'block';

  fetch(`/emails/${email.id}`)
  .then(response => response.json())
  .then(data => {
    //Create a p with the sender
    let sender = document.createElement("p");
    sender.innerHTML = `Sender: <b>${data.sender}</b>`;
    sender.className = "m-0";

    //Create a p with the recipients
    let recipients = document.createElement("p");
    recipients.innerHTML = `Recipients: <b>${data.recipients}</b>`;
    recipients.className = "m-0";

    //Create a p with the timestamp
    let timestamp = document.createElement("p");
    timestamp.innerHTML = `Timestamp: <b>${data.timestamp}</b>`;
    timestamp.className = "mb-2";

    //Create a button for reply
    let replyBtn = document.createElement("button");
    replyBtn.className = "btn btn-outline-primary btn-sm mr-2"
    replyBtn.innerHTML = "Reply";
    replyBtn.addEventListener("click", function() {
      compose_email();
      document.querySelector('#compose-recipients').value = data.sender;
      document.querySelector('#compose-subject').value = `Re: ${data.subject.replace("Re: ", '')}`;
      document.querySelector('#compose-body').value = `On ${data.timestamp} ${data.sender} wrote:\n${data.body}`;
    })

    //Create a button for archive
    let archiveBtn = document.createElement("button");
    archiveBtn.className = "btn btn-secondary btn-sm"
    if (!data.archived) {
      archiveBtn.innerHTML = "Archive";
    } else {
      archiveBtn.innerHTML = "Unarchive";
    }
    archiveBtn.addEventListener("click", function() {
      function setArchived(condition) {
        fetch(`/emails/${data.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            archived: condition
          })
        })
      }
      if (!data.archived) {
        setArchived(true);
      } else {
        setArchived(false);
      }
      //Load inbox
      setTimeout(function() {load_mailbox('inbox')}, 10);
    })

    //Create a h2 with the subject
    let subject = document.createElement("h2");
    subject.innerHTML = data.subject;
    subject.className = "mt-3"

    //Create a pre winth the body content
    let body = document.createElement("pre");
    body.className = "h6";
    body.innerHTML = data.body;

    //Clear and append all the items to the emails-content view
    document.querySelector('#email-view').innerHTML = '';
    document.querySelector('#email-view').append(sender, recipients, timestamp);
    //If the view requires the buttons, in the exception of "sent" mailbox
    if (btnCondition) {
      document.querySelector('#email-view').append(replyBtn, archiveBtn);
    }
    //Append the other compositions
    document.querySelector('#email-view').append(subject, body);
  });
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#email-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#emails-view').style.display = 'block';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  //Create a mailbox list
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
    //Get each email on mailbox
    emails.forEach(email => {
      //And create an div with its data
      const emailBox = document.createElement("div");
      emailBox.className = "email d-flex";
      emailBox.innerHTML = `${email.sender} <b class="ml-2">${email.subject}</b> <i class="ml-auto">${email.timestamp}</i>`;
      //Click Event for each email
      emailBox.addEventListener("click", function() {
        //Makes tthe email read
        fetch(`/emails/${email.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            read: true
          })
        });
        //Place the email data on the div, with an exception of the buttons for the mailbox sent
        if (mailbox !== 'sent') {
          showEmailContent(email, true);
        } else {
          showEmailContent(email, false);
        }
      });

      //Verify if the email is read
      if (email.read) {
        emailBox.style.background = "#cfcfcf";
        emailBox.style.border = "1px solid #909090";
      }

      //Append each email
      
      document.querySelector('#emails-view').append(emailBox);
    });
  });
}
