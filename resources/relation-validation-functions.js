// import "./relation-types.js";

function buildDisplayedGraph(relationType, validEntityTypes) {
  function getDisplayRelations() {
    var relations = displayedGraph.relations;
    // remove irrelevant relationships from displayedGraph.relations
    for (var i = relations.length - 1; i>= 0; i--) {
      if (relations[i].type != relationType) {
        relations.splice(i,1);
      }
    }
    // add relevant relations to displayedGraph.relations from editedGraph.relations
    for (i in editedGraph.relations) {
      let relation = editedGraph.relations[i];
      if (!relationInGraph(relation) && (relation.type == relationType) && !/S=\d\+|S=\d/.test(relation.type)) {
        relations.push({type : relation.type, 
                              startToken : relation.startToken, 
                              source : relation.source, 
                              endToken : relation.endToken, 
                              target : relation.target,
                            distance : linkDistance(relation.type)})
      }
    }
    return relations;
  }
  function getDisplayEntities() {
    var entitySet = new Set();
    var entityArray = [];
    function entityInSet(e) {
      for (let entity of entitySet) {
        if (entity.id == e.id) {
          return true;
        }
      }
      return false;
    }
    // Get entities of chosen relation type from displayedGraph.relations (update selection)
    displayedGraph.relations.forEach(function(relation) {
      if (relation.type == relationType) {
        entitySet.add(relation.source);
        entitySet.add(relation.target);
      }
    });
    // Add in entities with the chosen relation type from editedGraph.relations (enter selection)
    editedGraph.relations.forEach(function(relation) {
      if (relation.type == relationType) {
        // Add the source and target (have to get them from the editedGraph.entities)
        let source = editedGraph.getEntityById(relation.source);
        let target = editedGraph.getEntityById(relation.target);

        // If it's already in the set, we don't add it
        // We can't rely on the set determining uniqueness for us because
        // we are getting different objects that represent the same thing
        // an entity from editedGraph.entity and from displayedGraph.entity
        if (!entityInSet(source)) {
          entitySet.add(source);
        }
        if (!entityInSet(target)) {
          entitySet.add(target);
        }
      }
    });
    // Add in entities of chosen type from editedGraph.entities
    editedGraph.entities.forEach(function(entity) {
      if (validEntityTypes.includes(entity.type)) {
        if (!entityInSet(entity)) {
          entitySet.add(entity);
        }
      }
    });
    return Array.from(entitySet);
  }
  displayedGraph.entities = getDisplayEntities();
  displayedGraph.relations = getDisplayRelations();
}

function markBadRelations(badRelations) {
  // Styling for nodes/links of bad entities/relations
  if (Array.isArray(badRelations) && badRelations.length) {
    for (badRel of badRelations) {
      let linkId = "#linkarrayindex" + badRel[0].index;
      // console.log("linkId: " + linkId);
      d3.select(linkId).style("stroke","red");
      // console.log(d3.select(linkId));
      if (badRel[1] == "source") {
        let nodeId = "#arrayindex" + badRel[0].source.arrayindex;
        console.log(nodeId);
        d3.select(nodeId).select("circle").style("stroke","#ff0000");
      } else {
        let nodeId = "#arrayindex" + badRel[0].target.arrayindex;
        console.log(nodeId);
        d3.select(nodeId).select("circle").style("stroke","#ff0000");
      }
    }
  }
}
// returns the complement of an array of valid types, from a set of entity types
function getInvalidTypes(validTypes) {
  var types = getAllTypes();
  for (let i = types.length - 1; i >= 0; i--) {
    if (validTypes.includes(types[i])) {
      types.splice(i,1);
    }
  }
  return types;
}

function showUpdatedGraph(currentRelationship, validTypes) {
  buildDisplayedGraph(currentRelationship, validTypes);
  var invalidTypes = getInvalidTypes(validTypes);
  var badRelations = [];
  displayedGraph.relations.forEach(function(relation) {
    // check source and target against all types, for each relation
    for (let type of invalidTypes) {
      if (relation.source.type == type) {
        badRelations.push([relation, "source"]);
        console.log("Found a bad relation with bad source.");
      }
      if (relation.target.type == type) {
        badRelations.push([relation, "target"]);
        console.log("Found a bad relation with bad target.");
      }
    }
  });
  restart();
  markBadRelations(badRelations);
}
// *** From relation-function.js ***
function entityInGraph(entity) {
  for (a in displayedGraph.entities) {
    if ((displayedGraph.entities[a].id == entity.id) && (displayedGraph.entities[a].text == entity.text)) {
      return true;
    }
  }
  return false;
}
function relationInGraph(relation) {
  for (b in displayedGraph.relations) {
    if ((displayedGraph.relations[b].source.id == relation.source) && 
        (displayedGraph.relations[b].target.id == relation.target) && 
        (displayedGraph.relations[b].type == relation.type)) {
      return true;
    }
  }
  return false;
}
// This displays the entire graph with edits.
function loadWholeGraph() {
  for (i in editedGraph.entities) {
    var entity = editedGraph.entities[i];
    // is it the correct tag type?
    if (entity.tag == "ENAMEX" || entity.tag == "TIMEX" || entity.tag == "NUMEX") {
      // is it in the displayedGraph?
      if (!entityInGraph(entity)) {
        //var textentity = entity.text.replace(/ \n/g, " ").replace(/\n/g, " ");
        displayedGraph.entities.push({tag : entity.tag, type : entity.type, text : entity.text, id : entity.id, arrayindex : entity.arrayindex});
      }
    }
  }
  displayedGraph.relations = [];
  for (i in editedGraph.relations) {
    var relation = editedGraph.relations[i];
    // console.log(relationInGraph(relation));
      // if (relation.type == "E2:HAS_RESPL") {
      //   console.log("E2:HAS_RESPL found before if!");
      //   console.log(relationInGraph(relation));
      // }
    if (!relationInGraph(relation) && !/S=\d\+|S=\d/.test(relation.type)) {
      // if (relation.type == "E2:HAS_RESPL") { console.log("E2:HAS_RESPL found inside if!");}
      displayedGraph.relations.push({type : relation.type,
                            startToken : relation.startToken, 
                            source : relation.source, 
                            endToken : relation.endToken, 
                            target : relation.target,
                          distance : linkDistance(relation.type)});
    }
  }
  console.log("Showing All Relationships: ");
  // console.log(displayedGraph);
  restart();
  currentRelationship = "UNSELECTED";
}
var currentRelationship = "UNSELECTED";
function getCurrentRelationship() {
  return currentRelationship;
}
// ******
// *** Relation Functions ***
function hasStartDate() {
  currentRelationship = "E1:HAS_STDATE";
  var validTypes = getHasStartDateTypes();
  showUpdatedGraph(currentRelationship, validTypes);
  console.log("Displaying 'Has Start Date' graph");
}
function hasStartPlace() {
  currentRelationship = "E1:HAS_ST_PL";
  var validTypes = getHasStartPlaceTypes();
  showUpdatedGraph(currentRelationship, validTypes);
  console.log("Displaying 'Has Start Place' graph");
}
function hasStartTime() {
  currentRelationship = "E1:HAS_ST_TM";
  var validTypes = getHasStartTimeTypes();
  showUpdatedGraph(currentRelationship, validTypes);
  console.log("Displaying 'Has Start Time' graph");
}
function hasEndDate() {
  currentRelationship = "E3:HAS_ENDDATE";
  var validTypes = getHasEndDateTypes();
  showUpdatedGraph(currentRelationship, validTypes);
  console.log("Displaying 'Has End Date' graph");
}
function hasEndPlace() {
  currentRelationship = "E3:HAS_END_PL";
  var validTypes = getHasEndPlaceTypes();
  showUpdatedGraph(currentRelationship, validTypes);
  console.log("Displaying 'Has End Place' graph");
}
function hasEndTime() {
  currentRelationship = "E1:HAS_END_TM";
  var validTypes = getHasEndTimeTypes();
  showUpdatedGraph(currentRelationship, validTypes);
  console.log("Displaying 'Has End Time' graph");
}
function hasEvent() {
  currentRelationship = "Z:HAS_EVENT";
  var validTypes = getHasEventTypes();
  showUpdatedGraph(currentRelationship, validTypes);
  console.log("Displaying 'Has Event' graph");
}
function hasEventFact() {
  currentRelationship = "E4:HAS_EVENT_FACT";
  var validTypes = getHasEventFactTypes();
  showUpdatedGraph(currentRelationship, validTypes);
  console.log("Displaying 'Has Event Fact' graph");
}
function isEventFact() {
  currentRelationship = "E4:IS_EVENT_FACT";
  var validTypes = getIsEventFactTypes();
  showUpdatedGraph(currentRelationship, validTypes);
  console.log("Displaying 'Is Event Fact' graph");
}
function hasSpouse() {
  currentRelationship = "R00:HAS_SPOUSE";
  var validTypes = getHasSpouseTypes();
  showUpdatedGraph(currentRelationship, validTypes);
  console.log("Displaying 'Has Spouse' graph");
}
function hasFather() {
  currentRelationship = "R01:HAS_FATHER";
  var validTypes = getHasFatherTypes();
  showUpdatedGraph(currentRelationship, validTypes);
  console.log("Displaying 'Has Father' graph");
}
function hasMother() {
  currentRelationship = "R02:HAS_MOTHER";
  var validTypes = getHasMotherTypes();
  showUpdatedGraph(currentRelationship, validTypes);
  console.log("Displaying 'Has Mother' graph");
}
function ageOf() {
  currentRelationship = "Z:AGE_OF";
  var validTypes = getAgeOfTypes();
  showUpdatedGraph(currentRelationship, validTypes);
  console.log("Displaying 'Age Of' graph");
}
function attended() {
  currentRelationship = "Z:ATTENDED";
  var validTypes = getAttendedTypes();
  showUpdatedGraph(currentRelationship, validTypes);
  console.log("Displaying 'Attended' graph");
}
function causedBy() {
  currentRelationship = "Z:CAUSED_BY";
  var validTypes = getCausedByTypes();
  showUpdatedGraph(currentRelationship, validTypes);
  console.log("Displaying 'Caused By' graph");
}
function contactInfo() {
  currentRelationship = "Z:'S_CONTACT";
  var validTypes = getContactInfoTypes();
  showUpdatedGraph(currentRelationship, validTypes);
  console.log("Displaying 'Contact Info' graph");
}
function created() {
  currentRelationship = "Z:CREATED";
  var validTypes = getCreatedTypes();
  showUpdatedGraph(currentRelationship, validTypes);
  console.log("Displaying 'Created' graph");
}
function hasDuration() {
  currentRelationship = "Z:HAS_DURATION";
  var validTypes = getHasDurationTypes();
  showUpdatedGraph(currentRelationship, validTypes);
  console.log("Displaying 'Has Duration' graph");
}
function employedBy() {
  currentRelationship = "Z:EMPLOYED_BY";
  var validTypes = getEmployedByTypes();
  showUpdatedGraph(currentRelationship, validTypes);
  console.log("Displaying 'Employed By' graph");
}
function hasFamilyMember() {
  currentRelationship = "Z:HASFAMMEMLST";
  var validTypes = getHasFamilyMemberTypes();
  showUpdatedGraph(currentRelationship, validTypes);
  console.log("Displaying 'Has Family Member' graph");
}
function isFemale() {
  currentRelationship = "Z:IS_FEM_FOR";
  var validTypes = getIsFemaleTypes();
  showUpdatedGraph(currentRelationship, validTypes);
  console.log("Displaying 'Is Female' graph");
}
function isFictional() {
  currentRelationship = "Z:IS_FICTIONAL";
  var validTypes = getIsFictionalTypes();
  showUpdatedGraph(currentRelationship, validTypes);
  console.log("Displaying 'Is Fictional' graph");
}
function isMale() {
  currentRelationship = "Z:IS_MALE_FOR";
  var validTypes = getIsMaleTypes();
  showUpdatedGraph(currentRelationship, validTypes);
  console.log("Displaying 'Is Male' graph");
}
function isMemberOf() {
  currentRelationship = "Z:MEMBER_OF";
  var validTypes = getIsMemberOfTypes();
  showUpdatedGraph(currentRelationship, validTypes);
  console.log("Displaying 'Is Member Of' graph");
}
function nameCombiner() {
  currentRelationship = "Z:NAMEXTRA_OF";
  var validTypes = getNameCombinerTypes();
  showUpdatedGraph(currentRelationship, validTypes);
  console.log("Displaying 'Name Combiner' graph");
}
function hasOccupation() {
  currentRelationship = "Z:OCCUPATION_OF";
  var validTypes = getHasOccupationTypes();
  showUpdatedGraph(currentRelationship, validTypes);
  console.log("Displaying 'Has Occupation' graph");
}
function owns() {
  currentRelationship = "Z:OWNS";
  var validTypes = getOwnsTypes();
  showUpdatedGraph(currentRelationship, validTypes);
  console.log("Displaying 'Owns' graph");
}
function precedesRecently() {
  currentRelationship = "Z:PRECEDE_RCNT";
  var validTypes = getPrecedesRecentlyTypes();
  showUpdatedGraph(currentRelationship, validTypes);
  console.log("Displaying 'Preceden's Recently' graph");
}
function principalsAssociate() {
  currentRelationship = "Z:PRIN_ASSOC";
  var validTypes = getPrincipalsAssociateTypes();
  showUpdatedGraph(currentRelationship, validTypes);
  console.log("Displaying 'Principal's Associate' graph");
}
function isPrincipalPerson() {
  currentRelationship = "Z:IS_PRINCIPAL";
  var validTypes = getIsPrincipalPersonTypes();
  showUpdatedGraph(currentRelationship, validTypes);
  console.log("Displaying 'Is Principal Person' graph");
}
function quantity() {
  currentRelationship = "Z:NUMBER_OF";
  var validTypes = getQuantityTypes();
  showUpdatedGraph(currentRelationship, validTypes);
  console.log("Displaying 'Quantity' graph");
}
function hasResidencePlace() {
  currentRelationship = "E2:HAS_RESPL";
  var validTypes = getHasResidencePlaceTypes();
  showUpdatedGraph(currentRelationship, validTypes);
  console.log("Displaying 'Has Residence Place' graph");
}
function sameAs() {
  currentRelationship = "R40:IS_SAME_AS";
  var validTypes = getSameAsTypes();
  showUpdatedGraph(currentRelationship, validTypes);
  console.log("Displaying 'Same As' graph.");
}
function subplaceOf() {
  currentRelationship = "Z:SUBPLACE_OF";
  var validTypes = getSubplaceOfTypes();
  showUpdatedGraph(currentRelationship, validTypes);
  console.log("Displaying 'Subplace Of' graph.");
}
function hasTitle() {
  currentRelationship = "Z:TITLE_OF";
  var validTypes = getHasTitleTypes();
  showUpdatedGraph(currentRelationship, validTypes);
  console.log("Displaying 'Has Title' graph");
}