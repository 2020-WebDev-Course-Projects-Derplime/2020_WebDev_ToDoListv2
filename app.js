//jshint esversion:6

const express = require("express");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(express.urlencoded({
  extended: true
}));
app.use(express.static("public"));

const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false
};

mongoose.connect("mongodb://localhost:27017/todoListDB", options);

// Items Schema
const itemsSchema = {
  name: String
};

// Mongoose Model
const Item = mongoose.model("Item", itemsSchema);

// Default items
const item1 = new Item({
  name: "Welcome to your To Do List!"
});
const item2 = new Item({
  name: "Hit the + to add a new item!"
});
const item3 = new Item({
  name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];

// List Schema
const listsSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listsSchema);

app.get("/", function (req, res) {
  Item.find({}, (err, foundItems) => {

    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, (err) => {
        if (err) {
          console.error(err);
        } else {
          console.log("Added default stuff to DB");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", {
        listTitle: "Today",
        newListItems: foundItems
      });
    };
  });
});

app.get("/:listName", function (req, res) {

  const customListName = _.capitalize(req.params.listName);
  List.findOne({
    name: customListName
  }, (err, foundList) => {
    if (!err) {
      if (!foundList) {
        // create new list
        const list = new List({
          name: customListName,
          items: defaultItems
        });

        list.save();
        res.redirect(`/${customListName}`);
      } else {
        // show existing list
        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items
        });
      }
    }
  });
});

app.post("/", function (req, res) {

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName }, (err, foundList) => {
      if (err) {
        console.error(err);
      } else {
        foundList.items.push(item);
        foundList.save();
        res.redirect(`/${listName}`);
      }
    });
  }
});

app.post("/delete", function (req, res) {

  const checkedItem = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findOneAndRemove(checkedItem, (err) => {
      if (!err) {
        console.log("Successfully deleted checked item!");
      }
    });
  
    res.redirect("/");
  } else {
    const queryOption = {
      $pull: {
        items: {
          _id: checkedItem
        }
      }
    }
    // Remove element from an array of a document
    List.findOneAndUpdate({ name: listName }, queryOption, (err, foundList) => {
      if (!err) {
        res.redirect(`/${listName}`);
      }
    });
  }
});

app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});