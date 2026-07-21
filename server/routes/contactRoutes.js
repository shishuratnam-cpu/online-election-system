const express = require("express");
const router = express.Router();

const db = require("../config/db");


// GET contact details
router.get("/", async (req, res) => {

    try {

        const [result] = await db.query(
            "SELECT * FROM contact_settings LIMIT 1"
        );

        res.json(result[0]);

    } catch (err) {

        res.status(500).json({
            message: err.message
        });

    }

});


// UPDATE contact details
router.put("/", async (req, res) => {

    try {

        const { phone, email } = req.body;


        await db.query(
            "UPDATE contact_settings SET phone=?, email=? WHERE id=1",
            [phone, email]
        );


        res.json({
            message: "Contact details updated successfully"
        });


    } catch (err) {

        res.status(500).json({
            message: err.message
        });

    }

});


module.exports = router;