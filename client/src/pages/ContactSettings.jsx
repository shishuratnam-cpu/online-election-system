import React, { useEffect, useState } from "react";
import api from "../services/api";

function ContactSettings() {

    const [contact, setContact] = useState({
        phone: "",
        email: ""
    });


    useEffect(() => {
        fetchContact();
    }, []);


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


    const updateContact = async () => {

        try {

            await api.put("/contact-settings", contact);

            alert("Contact details updated successfully");

        } catch(error) {

            console.log(error);

        }

    };


    return (
        <div>

            <h2>Customer Helpline Settings</h2>


            <div>

                <label>
                    Phone Number
                </label>

                <input
                    type="text"
                    value={contact.phone}
                    onChange={(e)=>
                        setContact({
                            ...contact,
                            phone:e.target.value
                        })
                    }
                />

            </div>


            <div>

                <label>
                    Email Address
                </label>

                <input
                    type="email"
                    value={contact.email}
                    onChange={(e)=>
                        setContact({
                            ...contact,
                            email:e.target.value
                        })
                    }
                />

            </div>


            <button onClick={updateContact}>
                Save Changes
            </button>


        </div>
    );
}


export default ContactSettings;