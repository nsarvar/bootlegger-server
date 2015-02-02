/**
 * DeliveryController
 *
 * @module		:: Controller
 * @description	:: Contains logic for handling requests.
 */

module.exports = {

  /* e.g.
  sayHello: function (req, res) {
    res.send('hello world!');
  }
  */
  
  /**
   * /delivery/controller
   */ 
  index: function (req,res) {

    // This will render the view: 
    // D:\Research\Research\bootlegging\server/views/delivery/controller.ejs
    res.view();

  }

};
