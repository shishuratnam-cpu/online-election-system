import React, { useEffect, useState } from "react";
import api from "../services/api";

const ContactHelp = () => {

    const [contact, setContact] = useState({
        phone: "",
        email: ""
    });

    useEffect(() => {

        const fetchContact = async () => {

            try {

                const res = await api.get("/contact-settings");

                setContact({
                    phone: res.data.phone,
                    email: res.data.email
                });

            } catch (error) {
                console.log(error);
            }

        };

        fetchContact();

    }, []);

    return (
        <footer className="bg-dark text-light mt-5 pt-4 pb-3 border-top">

            <div className="container">

                <div className="row">

                    {/* Contact */}
                    <div className="col-md-4 mb-3">
                        <h5 className="mb-3">Contact Us</h5>

                        <p className="mb-2">
                            📞 <strong>Helpline:</strong><br />
                            {contact.phone}
                        </p>

                        <p>
                            ✉ <strong>Email:</strong><br />
                            {contact.email}
                        </p>
                    </div>

                    {/* Terms */}
                    <div className="col-md-8">
                        <h5 className="mb-3">Terms & Conditions</h5>

                        <ul className="small">
                            <li>Each registered voter can cast only one vote.</li>
                            <li>Votes cannot be changed once submitted.</li>
                            <li>Only approved candidates are eligible to contest.</li>
                            <li>Sharing login credentials is strictly prohibited.</li>
                            <li>Fraudulent activities may lead to account suspension.</li>
                            <li>Election results published by the system are final.</li>
                            <li>User information is used only for election purposes.</li>
                        </ul>
                    </div>

                </div>

                <hr className="border-secondary" />

                <div className="text-center small">
                    © {new Date().getFullYear()} Online Election System. All Rights Reserved.
                </div>

            </div>

        </footer>
    );
};

export default ContactHelp;