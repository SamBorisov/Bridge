//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

contract Event is Ownable{


  /* Constructor to initiate event ERC721's. */
  function TicketedEvents(string _name, string _location, string _symbol, uint256 _ticketsAvailable, uint256 _ticketPrice)
    public {
      name = _name;
      location = _location;
      symbol = _symbol;
      totalTicketsAvailable = _ticketsAvailable; 
      ticketPrice = _ticketPrice; 
    }

    function newEventCreation(address _ticketSeller, string _eventName, uint256 _ticketsSaleStart, uint256 _ticketsSaleEnd, uint256 _ticketPrice)  
        public returns (address eventContract) {
            TicketedEvents theCreatedEvent = new TicketedEvents(_eventName, _eventLocation, _eventSymbol, _totalTicketsAvailable, _ticketPrice);
            require(theCreatedEvent.transferOwnership(_ticketSeller));
            return theCreatedEvent; 
        }


}