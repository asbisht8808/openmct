/*global define,describe,it,expect,beforeEach,waitsFor,jasmine,window,afterEach*/

define(
    ["../../src/actions/StartTimerAction"],
    function (StartTimerAction) {
        "use strict";

        describe("A timer's start action", function () {
            var mockNow,
                mockDomainObject,
                mockPersistence,
                testModel,
                testContext,
                action;

            function asPromise(value) {
                return (value || {}).then ? value : {
                    then: function (callback) {
                        return asPromise(callback(value));
                    }
                };
            }

            beforeEach(function () {
                mockNow = jasmine.createSpy('now');
                mockDomainObject = jasmine.createSpyObj(
                    'domainObject',
                    [ 'getCapability', 'useCapability', 'getModel' ]
                );
                mockPersistence = jasmine.createSpyObj(
                    'persistence',
                    ['persist']
                );

                mockDomainObject.getCapability.andCallFake(function (c) {
                    return (c === 'persistence') && mockPersistence;
                });
                mockDomainObject.useCapability.andCallFake(function (c, v) {
                    if (c === 'mutation') {
                        testModel = v(testModel) || testModel;
                        return asPromise(true);
                    }
                });
                mockDomainObject.getModel.andCallFake(function () {
                    return testModel;
                });

                testModel = {};
                testContext = { domainObject: mockDomainObject };

                action = new StartTimerAction(mockNow, testContext);
            });

            it("updates the model with a timestamp and persists", function () {
                mockNow.andReturn(12000);
                action.perform();
                expect(testModel.timestamp).toEqual(12000);
                expect(mockPersistence.persist).toHaveBeenCalled();
            });

            it("applies only to timers without a target time", function () {
                testModel.type = 'warp.timer';
                testModel.timestamp = 12000;
                expect(StartTimerAction.appliesTo(testContext)).toBeFalsy();

                testModel.type = 'warp.timer';
                testModel.timestamp = undefined;
                expect(StartTimerAction.appliesTo(testContext)).toBeTruthy();

                testModel.type = 'warp.clock';
                testModel.timestamp = 12000;
                expect(StartTimerAction.appliesTo(testContext)).toBeFalsy();
            });
        });
    }
);