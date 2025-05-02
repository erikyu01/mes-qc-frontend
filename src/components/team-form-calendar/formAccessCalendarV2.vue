<template>
  <el-container>
    <!-- Team List -->
    <el-aside ref="teamPanel" class="aside-panel-left">
      <el-table
          :data="teamsOptions"
          @cell-click="handleTeamCellClick"
          class="clickable-table"
          :row-class-name="getRowClass"
      >
        <el-table-column ref="teamTableColumn" width="50px">
          <template #default="scope">
            <el-button
                :icon="visibleTeams.has(scope.row.id) ? Check : ''"
                circle
                size="small"
                :style="{
                  backgroundColor: visibleTeams.has(scope.row.id) ? getColorByTeamId(scope.row.id) : 'transparent',
                  border: `2px solid ${getColorByTeamId(scope.row.id)}`,
                  color: visibleTeams.has(scope.row.id) ? '#fff' : getColorByTeamId(scope.row.id)
                }"
            />
          </template>
        </el-table-column>
        <el-table-column prop="label" label="Teams" sortable show-overflow-tooltip/>
      </el-table>
    </el-aside>
    <el-container>
      <el-header height="40px">
        <div style="display: flex; justify-content: space-between; align-items: center;">

          <div style="display: flex; align-items: center;">
          <el-input
              v-model="searchQuery"
              :placeholder="translate('userManagement.searchPlaceholder')"
              clearable
              size="large"
              style="width: 300px;"
          >
            <template #prefix>
              <el-icon>
                <Search />
              </el-icon>
            </template>
          </el-input>
        </div>

          <div style="display: flex; align-items: center;">
            <!-- Tour Button -->
<!--            <el-tooltip :content="'Tour'" placement="top">-->
<!--              <el-button-->
<!--                  :icon="QuestionFilled"-->
<!--                  size="large"-->
<!--                  style="margin: 0px;"-->
<!--                  circle-->
<!--                  @click="tourEnabled = true"-->
<!--              >-->
<!--              </el-button>-->
<!--            </el-tooltip>-->

            <!-- Refresh Button -->
            <el-tooltip :content="'Refresh Calendar'" placement="top">
              <el-button
                  class="refresh-button"
                  size="large"
                  type="primary"
                  circle
                  @click="fetchAllCalendarAssignment"
              >
                <el-icon style="color: #004085;"><RefreshRight /></el-icon>
              </el-button>
            </el-tooltip>
          </div>
        </div>
      </el-header>
      <el-main>
        <!-- Calendar -->
        <FullCalendar ref="calendar" :options="calendarOptions"/>
      </el-main>
    </el-container>
    <el-aside class="aside-panel-right">
      <!-- Aside Header -->
      <div
          style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;"
      >
        <!-- Left: Title -->
        <p v-if="isEditing || showAssignmentForm || selectedEvent?.id" style="margin: 0;">
          <b>{{ subTabTitle() }}</b>
        </p>

        <!-- Right: Edit/Delete Buttons -->
        <div
            v-if="selectedEvent?.id && !showAssignmentForm"
        >
          <el-button type="primary" @click="handleEditClick" style="margin: 0 5px 0 0;">Edit</el-button>
          <el-button type="danger" @click="handleDeleteAssignment" style="margin: 0;">Delete</el-button>
        </div>
      </div>

      <!-- Access Assignment Form -->
      <el-form
          ref="assignmentFormRef"
          v-if="showAssignmentForm"
          :model="assignmentForm"
          :rules="formRules"
      >
        <el-form-item prop="title" :label="'Name'" required>
          <el-input v-model="assignmentForm.title" />
        </el-form-item>

        <el-form-item prop="extendedProps.teamId" :label="'Team'" required>
          <el-select
              v-model="assignmentForm.extendedProps.teamId"
              filterable
              :placeholder="translate('userManagement.addDialog.assignedTeamPlaceHolder')"
          >
            <el-option
                v-for="team in teamsOptions"
                :key="team.id"
                :label="team.label"
                :value="team.id"
            >
              <span style="float: left">{{ team.label }}</span>
              <span
                  style="
                        float: right;
                        color: var(--el-text-color-secondary);
                        font-size: 13px;
                     "
              >
                    {{ translate('userManagement.table.leader') + ": " + team.value }}
                </span>
            </el-option>
          </el-select>
        </el-form-item>

        <el-row>
          <el-col :span="12">
            <el-form-item label="Recurring" style="margin-left: 10px;">
              <el-checkbox
                  v-model="isAssignmentRecurring"
                  @change="handleRecurrenceCheckboxChange"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="All Day" style="margin-left: 10px;">
              <el-checkbox
                  v-model="assignmentForm.allDay"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item v-if="!isAssignmentRecurring" prop="start" :label="'Start Date'" required>
          <el-date-picker
              v-model="assignmentForm.start"
              :type="assignmentForm.allDay ? 'date' : 'datetime'"
              placeholder="Select start date"
          />
        </el-form-item>

        <el-form-item v-if="!isAssignmentRecurring" prop="end" :label="'End Date'" required>
          <el-date-picker
              v-model="assignmentForm.end"
              :type="assignmentForm.allDay ? 'date' : 'datetime'"
              placeholder="Select end date"
              :disabled-date="createDisabledEndDate('start')"
          />
        </el-form-item>

        <el-form-item
            v-if="isAssignmentRecurring"
            label-position="top"
            prop="daysOfWeek"
            style="margin-left: 10px;"
        >
          <el-form-item prop="startRecur" :label="'Recurrence Start Date'" label-position="top">
            <el-date-picker
                v-model="assignmentForm.startRecur"
                type="date"
                placeholder="Select start date"
            />
          </el-form-item>

          <el-form-item prop="endRecur" :label="'Recurrence End Date'" label-position="top">
            <el-date-picker
                v-model="assignmentForm.endRecur"
                type="date"
                placeholder="Select end date"
                :disabled-date="createDisabledEndDate('startRecur')"
            />
          </el-form-item>

          <el-form-item v-if="!assignmentForm.allDay" label ="Start Time" label-position="top">
            <el-time-picker v-model="assignmentForm.startTime" placeholder="Select start time"/>
          </el-form-item>

          <el-form-item v-if="!assignmentForm.allDay" label ="End Time" label-position="top">
            <el-time-picker v-model="assignmentForm.endTime" placeholder="Select end time"/>
          </el-form-item>

          <el-form-item prop="daysCheckBoxes" :label="'Repeat On'" label-position="top">
            <el-checkbox-group
                v-model="assignmentForm.daysOfWeek"
            >
              <el-checkbox :label="'Monday'" :value="1"/>
              <el-checkbox :label="'Tuesday'" :value="2"/>
              <el-checkbox :label="'Wednesday'" :value="3"/>
              <el-checkbox :label="'Thursday'" :value="4"/>
              <el-checkbox :label="'Friday'" :value="5"/>
              <el-checkbox :label="'Saturday'" :value="6"/>
              <el-checkbox :label="'Sunday'" :value="0"/>
            </el-checkbox-group>
          </el-form-item>
        </el-form-item>

        <el-form-item prop="extendedProps.formTreeNodeIds" :label="'Accessible Form'" required label-position="top">
          <TeamFormTree
              :show-only-selected-node="false"
              :selected-form-ids="assignmentForm.extendedProps.formTreeNodeIds"
              :expand-all-nodes="false"
              @update-selected-forms="handleFormChanged"
          />
        </el-form-item>
      </el-form>

      <!-- Save/Cancel buttons for form -->
      <div v-if="showAssignmentForm">

        <el-button type="primary" @click="validateAndSave">Save</el-button>
        <el-button @click="handleCancel">Cancel</el-button>
      </div>

      <!-- Assignment Detail View -->
      <el-descriptions
          v-if="showAssignmentDetail"
          :column="1"
          direction="horizontal"
          style="margin-top: 20px"
          :width="250"
      >
        <el-descriptions-item label="ID">
          {{ selectedEvent?.id }}
        </el-descriptions-item>
        <el-descriptions-item label="Name">
          {{ selectedEvent.title }}
        </el-descriptions-item>

        <el-descriptions-item label="Team">
          <el-tag size="small" round style="margin-right: 5px;">
            <el-popover
                trigger="hover"
                placement="top"
                width="300"
            >
              <template #default>
                <div v-if="teamDetails[selectedEvent.extendedProps.teamId]">
                  <p><b>ID:</b> {{ teamDetails[selectedEvent.extendedProps.teamId].id }}</p>
                  <p><b>Type:</b> {{ teamDetails[selectedEvent.extendedProps.teamId].type || '-' }}</p>
                  <p><b>Leader:</b> {{ teamDetails[selectedEvent.extendedProps.teamId].leader || '-' }}</p>
                  <p><b>Description:</b> {{ teamDetails[selectedEvent.extendedProps.teamId].description || '-' }}</p>
                  <template v-if="teamDetails[selectedEvent.extendedProps.teamId].members?.length > 0">
                    <p><b>Members:</b></p>
                    <ul style="padding-left: 20px;">
                      <li v-for="member in teamDetails[selectedEvent.extendedProps.teamId].members" :key="member.id">
                        {{ member.name }} ({{ member.role.name }})
                      </li>
                    </ul>
                  </template>
                </div>
                <div v-else>Loading...</div>
              </template>
              <template #reference>
                {{ getTeamNameById(selectedEvent.extendedProps.teamId) }}
              </template>
            </el-popover>
          </el-tag>
        </el-descriptions-item>

        <el-descriptions-item v-if="selectedEvent.start" label="Start Date">
          {{ formatDate(selectedEvent.start, 'yyyy-MM-dd HH:mm') || '-' }}
        </el-descriptions-item>
        <el-descriptions-item v-if="selectedEvent.end" label="End Date">
          {{ formatDate(selectedEvent.end, 'yyyy-MM-dd HH:mm') || '-' }}
        </el-descriptions-item>

        <el-descriptions-item v-if="selectedEvent.groupId" label="Group ID">
          {{ selectedEvent?.groupId }}
        </el-descriptions-item>

        <el-descriptions-item label="Recurrence Start Date" v-if="isAssignmentRecurring">
          {{ selectedEvent.startRecur ? formatDate(selectedEvent.startRecur, 'yyyy-MM-dd') : 'Unlimited' }}
        </el-descriptions-item>

        <el-descriptions-item label="Recurrence End Date" v-if="isAssignmentRecurring">
          {{ selectedEvent.endRecur ? formatDate(selectedEvent.endRecur, 'yyyy-MM-dd') : 'Unlimited' }}
        </el-descriptions-item>

        <el-descriptions-item label="Repeated On" v-if="isAssignmentRecurring">
          {{
            selectedEvent.daysOfWeek?.length
                ? mapDaysOfWeek(selectedEvent.daysOfWeek)
                : '-'
          }}
        </el-descriptions-item>

        <el-descriptions-item label="Daily Start Time" v-if="isAssignmentRecurring && !selectedEvent.allDay">
          {{ selectedEvent.startTime ? formatDate(selectedEvent.startTime, 'HH:mm') : '-' }}
        </el-descriptions-item>

        <el-descriptions-item label="Daily End Time" v-if="isAssignmentRecurring && !selectedEvent.allDay">
          {{ selectedEvent.endTime ? formatDate(selectedEvent.endTime, 'HH:mm') : '-' }}
        </el-descriptions-item>

        <el-descriptions-item label="Accessible Forms">
          <TeamFormTree
              :show-only-selected-node="true"
              :selected-form-ids="selectedEvent.extendedProps.formTreeNodeIds"
              :expand-all-nodes="true"
          />
        </el-descriptions-item>
      </el-descriptions>
    </el-aside>
  </el-container>

  <!-- Tour Content -->
  <el-tour v-model="tourEnabled">

    <!-- Step : Calendar body -->
    <el-tour-step
        title="Form Access Calendar"
        description="Displays all form assignment for each teams in the current view."
        placement="top"
        :target="calendarTarget"
    />

    <!-- Step : Header toolbar -->
    <el-tour-step
        title="Tool Bar"
        description="Use tool bar to control the calendar's format and display data."
        placement="bottom"
        :target="calendarHeaderTarget"
    />

    <!-- Step : View buttons -->
    <el-tour-step
        title="View Buttons"
        description="Click to switch to different view. The default is month view."
        placement="bottom"
        :target="calendarViewButtonGroupTarget"
    />

    <!-- Step : Empty date -->
    <el-tour-step
        title="Create Assignment"
        description="Click on any empty date to create a new assignment starting from this date."
        placement="top"
        :target="calendarEmptyDateTarget"
    />

    !-- Step : Assignment detail panel -->
    <el-tour-step
        title="Fill Assignment Form"
        description="Create a form access assignment by filling the required fields."
        placement="left"
        :target="assignmentPanelTarget"
    />

    <!-- Step : Event -->
    <el-tour-step
        title="View Assignment"
        description="Click on any event to view detail of it."
        placement="top"
        :target="calendarEventTarget"
    />

    <!-- Step : Assignment detail panel -->
    <el-tour-step
        title="Assignment Detail"
        description="Displays detail for the selected assignment."
        placement="left"
        :target="assignmentPanelTarget"
    />

    <!-- Step : Teams panel -->
    <el-tour-step
        title="Team Panel"
        description="Displays all teams and color for corresponding assignments."
        placement="right"
        :target="teamPanelTarget"
    />

    <!-- Step : Teams row -->
    <el-tour-step
        title="Toggle visibility"
        description="Click on each row to toggle visibility of assignments of the team."
        placement="right"
        target=".tour-first-team-row"
    />
  </el-tour>
</template>

<script>
import FullCalendar from '@fullcalendar/vue3'
import timeGridPlugin from '@fullcalendar/timegrid'
import dayGridPlugin from '@fullcalendar/daygrid'
import listPlugin from '@fullcalendar/list'
import multiMonthPlugin from '@fullcalendar/multimonth'
import interactionPlugin from '@fullcalendar/interaction'
import allLocales from '@fullcalendar/core/locales-all.js';
import TeamFormTree from "@/components/dispatch/TeamFormTree.vue";
import {translate} from "@/utils/i18n";
import {Check, QuestionFilled, RefreshRight, Search} from "@element-plus/icons-vue";
import {getAllTeams} from "@/services/teamService";
import {generateFormMap, getCurrentLanguage} from '@/utils/dispatch-utils';
import {
  createCalendarAssignment, deleteCalendarAssignment,
  getAllCalendarAssignments,
  updateCalendarAssignment
} from "@/services/calendarAssignmentService";
import {fetchFormNodes} from "@/services/formNodeService";
import {getUsersForTeam} from "@/services/teamUserService";


export default {
  watch:{
    searchQuery() {
      this.searchOnVisibleTeamEvents();
    }
  },
  computed: {
    QuestionFilled() {
      return QuestionFilled
    },
    Check() {
      return Check
    },
    calendarApi() {
      return this.$refs.calendar?.getApi?.() ?? null;
    },
    teamPanelTarget() {
      return this.$refs.teamPanel?.$el || this.$refs.teamPanel;
    },
    calendarTarget() {
      return document.querySelector('.fc-view-harness'); // main calendar container
    },
    calendarHeaderTarget() {
      return document.querySelector('.fc-header-toolbar'); // top bar with navigation
    },
    calendarViewButtonGroupTarget() {
      return document.querySelector('.fc-header-toolbar .fc-toolbar-chunk:last-child .fc-button-group');
    },
    calendarEmptyDateTarget() {
      return document.querySelector('.fc-daygrid-day:not(.fc-day-other)'); // any visible date cell
    },
    calendarEventTarget() {
      return document.querySelector('.fc-event'); // first event element in DOM
    },
    assignmentPanelTarget() {
      return document.querySelector('.aside-panel-right'); // form/detail panel
    },
  },
  components: {
    QuestionFilled,
    TeamFormTree,
    FullCalendar,
    Search,
    Check,
    RefreshRight,
  },
  data(){
    return {
      isLoadingCalendar: false, // currently not in use, seems to be very distracting
      searchQuery: '',
      tourEnabled: false,
      teamDetails: {},
      lastEditOriginalData: null,
      formMap: [],
      showAssignmentForm: false,
      showAssignmentDetail: false,
      isEditing: false,
      selectedEvent: null,
      lastSelectedEventId: null,
      isAssignmentRecurring: false,
      assignmentForm: {
        id: null,
        title: null,
        start: null,
        end: null,
        extendedProps: {
          teamId: null,
          formTreeNodeIds: [],
        },
        groupId: null,
        daysOfWeek: null,
        startRecur: null,
        endRecur: null,
        startTime: null,
        endTime: null,
      },
      formRules: {
        title: [{ required: true, message: 'Please enter a name', trigger: 'blur' }],
        'extendedProps.teamId': [{ required: true, message: 'Please select a team', trigger: 'change' }],
        start: [
          {
            validator: (rule, value, callback) => {
              if (!this.isAssignmentRecurring && !value) {
                callback(new Error('Please select a start date'));
              } else {
                callback();
              }
            },
            trigger: 'change'
          }
        ],
        end: [
          {
            validator: (rule, value, callback) => {
              if (!this.isAssignmentRecurring && !value) {
                callback(new Error('Please select an end date'));
              } else {
                callback();
              }
            },
            trigger: 'change'
          }
        ],
        'extendedProps.formTreeNodeIds': [{ type: 'array', required: true, message: 'Please select at least one form', trigger: 'change' }],
        daysOfWeek: [
          {
            validator: this.validateDaysOfWeek,
            trigger: 'change'
          }
        ]
      },
      calendarOptions: {
        plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin, multiMonthPlugin],
        initialView: 'dayGridMonth',
        headerToolbar: {
          left: 'prev,next,today',
          center: 'title',
          right: 'multiMonthYear,dayGridMonth,timeGridWeek,timeGridDay,listWeek',
        },
        views: {
          dayGridMonth: { buttonText: 'Month' },
          timeGridWeek: { buttonText: 'Week' },
          timeGridDay: { buttonText: 'Day' },
          listWeek: { buttonText: 'List' },
          multiMonthYear: { buttonText: 'Year' },
        },
        dateClick: this.handleDateClick,
        eventClick: this.handleEventClick,
        selectable: true,
        height: '87vh',
        eventDrop: this.handleEventDrop,
        eventResize: this.handleEventResize,
        events: [],
        eventTextColor: '#000000',
        nowIndicator: true,
        selectMirror: true,
        locales: allLocales,
        locale: this.getCalendarLocale(),
        editable: false,
      },
      teamsOptions: [],
      // Dummy data, will fetch data from backend when ready
      visibleTeams: new Set(),
      calendarAssignments: [],
      calendarEvents: [],
      selectedHighlightColor: '#b3b3b3',
      colors: [
        '#ff5659',
        '#f8b25d',
        '#f8e462',
        '#a1f860',
        '#76fd9c',
        '#83fad9',
        '#52eefb',
        '#5cacfb',
        '#b459ff',
        '#e459fa',
        '#f85ed4',
      ]
    }
  },
  methods: {
    handleDateClick(arg) {
      // TODO: temporarily use cancel to revert changes in case edit is not confirm
      this.handleCancel();

      this.revertLastSelectedEvent();

      // Adjust selection and hides assignment detail
      this.selectedEvent = null;
      this.showAssignmentDetail = false;

      // Prefill for date and isAllDay
      this.resetAssignmentFormWithEmptyData();
      this.assignmentForm.start = arg.date;
      this.assignmentForm.allDay = arg.allDay

      this.isAssignmentRecurring = false;
      this.showAssignmentForm = true;
    },
    async handleEventClick(info) {
      // TODO: temporarily use cancel to revert changes in case edit is not confirm
      // this.handleCancel();

      this.revertLastSelectedEvent(info.event.id)

      // Highlight currently selected event
      info.event.setProp('backgroundColor', this.selectedHighlightColor);
      info.event.setProp('borderColor', this.selectedHighlightColor);
      this.lastSelectedEventId = info.event.id;

      // Setup data to display
      this.selectedEvent = {
        id: info.event.id,
        allDay: info.event.allDay,
        title: info.event.title,
        extendedProps: {
          ...info.event.extendedProps, // clone to avoid readonly issues
          formTreeNodeLabels: (info.event.extendedProps.formTreeNodeIds || []).map(
              id => this.formMap[id] || "(unknown label)"
          )
        },
      }

      // Fetch recurrence related data
      const recurringDef = info.event._def?.recurringDef?.typeData;

      if (recurringDef) {
        if (info.event._def.groupId){
          this.selectedEvent.groupId = info.event._def.groupId;
        }

        if (recurringDef.daysOfWeek) {
          this.isAssignmentRecurring = true;
          this.selectedEvent.daysOfWeek = recurringDef.daysOfWeek;
        }

        if (recurringDef.startRecur) {
          this.selectedEvent.startRecur = recurringDef.startRecur;
        }

        if (recurringDef.endRecur) {
          this.selectedEvent.endRecur = recurringDef.endRecur;
        }

        if (recurringDef.startTime) {
          this.selectedEvent.startTime = this.durationToDate(recurringDef.startTime);
        }

        if (recurringDef.endTime) {
          this.selectedEvent.endTime = this.durationToDate(recurringDef.endTime);
        }
      } else {
        this.isAssignmentRecurring = false;
      }

      // Fetch startDate & endDate if not a recurring event
      if (!this.isAssignmentRecurring) {
        this.selectedEvent.start = info.event.start;
        this.selectedEvent.end = info.event.end;
      }

      await this.fetchTeamDetails(this.selectedEvent.extendedProps.teamId);

      // Show detail window
      this.showAssignmentDetail = true;
      this.showAssignmentForm = false;
      console.log('handleEventClick: ', this.selectedEvent);
    },
    handleEditClick() {
      // Set the selected event draggable/resizable
      const calendarApi = this.calendarApi;
      const event = calendarApi.getEventById(this.selectedEvent.id);

      if (event) {
        event.setProp('startEditable', true);
        event.setProp('durationEditable', true);

        // Cache original values in case of canceling edit
        this.lastEditOriginalData = {
          id: event.id,
          start: event.start,
          end: event.end
        };

        console.log('Change selected event to be drag and resizable, cached original data');
      }

      // Prepare form with selected event
      // this.assignmentForm = {
      //   ...this.selectedEvent
      // };

      this.assignmentForm = JSON.parse(JSON.stringify(this.selectedEvent));

      // Show form window
      this.showAssignmentDetail = false;
      this.isEditing = true;
      this.showAssignmentForm = true;

      console.log("prefilled assignment form:", this.assignmentForm);
    },
    async handleSubmitClick() {
      // TODO: this expects FC event format
      // Destruct assignment form data
      const {
        id,
        groupId,
        title,
        start,
        end,
        extendedProps,
        daysOfWeek,
        startRecur,
        endRecur,
        allDay,
        startTime,
        endTime,
      } = this.assignmentForm;

      // Setup recurrence related fields
      const recurrenceData = this.isAssignmentRecurring
          ? {
            groupId: this.isEditing ? groupId : null,
            daysOfWeek: daysOfWeek,
            startDateRecur: startRecur,
            endDateRecur: endRecur,
            startTime: this.formatTimeToIsoString(startTime),
            endTime: this.formatTimeToIsoString(endTime),
          }
          : {};

      // Format object to match api, filter out invalid kv pairs
      const eventPayload = Object.fromEntries(
          Object.entries({
            name: title,
            startDate: start,
            endDate: end,
            allDay,
            ...recurrenceData,
            formTreeNodeIds: extendedProps.formTreeNodeIds,
            teamId: extendedProps.teamId,
          }).filter(([_, value]) => value !== null && value !== undefined && value !== "undefined" && value !== ""));

      const currentUserId = this.$store.getters.getUser.id;

      const response = this.isEditing
          ? await updateCalendarAssignment(id, {...eventPayload, updated_by: currentUserId })
          : await createCalendarAssignment({ ...eventPayload, created_by: currentUserId });

      if (response.data.status === 200) {
        this.$message.success("Assignment " + (this.isEditing ? "updated" : "created"));
      }


      // TODO: Update calendar once received success confirmation from backend, need to transform
      // assignmentForm into event object format later on
      const calendarApi = this.calendarApi;

      if (this.isEditing && id) {
        const existingEvent = calendarApi.getEventById(eventPayload.id);
        if (existingEvent) {
          for (const [key, value] of Object.entries(eventPayload)) {
            if (key === 'extendedProps') {
              for (const [k, v] of Object.entries(value)) {
                existingEvent.setExtendedProp(k, v);
              }
            } else if (value !== undefined) {
              existingEvent.setProp(key, value);
            }
          }
          existingEvent.setProp('startEditable', false);
          existingEvent.setProp('durationEditable', false);
          existingEvent.setProp('backgroundColor', this.getColorByTeamId(eventPayload.teamId));
          existingEvent.setProp('borderColor', this.getColorByTeamId(eventPayload.teamId));

          console.log('updating event in FC');
        }
      } else {
        calendarApi.addEvent({
          ...eventPayload,
          startEditable: false,
          durationEditable: false,
          backgroundColor: this.getColorByTeamId(eventPayload.teamId),
          borderColor: this.getColorByTeamId(eventPayload.teamId),
        });

        console.log('adding event in FC');
      }

      // Hide Assignment Form Window
      this.isAssignmentRecurring = false;
      this.showAssignmentForm = false;

      await this.fetchAllCalendarAssignment();

      // Refresh info in detail window with newly saved data
      if (this.isEditing) {
        const e = calendarApi.getEventById(eventPayload.id);
        await this.handleEventClick({e});

        this.isEditing = false;
      }

      this.resetAssignmentFormWithEmptyData();
      console.log("submitted event payload:", eventPayload);
    },
    async handleDeleteAssignment() {
      const eventId = this.selectedEvent?.id;
      const currentUserId = this.$store.getters.getUser.id;

      if (!eventId) return;
      const response = await deleteCalendarAssignment(eventId, currentUserId);

      if (response.data.status === '200') {
        // Remove from FullCalendar
        const calendarApi = this.calendarApi;
        const event = calendarApi.getEventById(this.selectedEvent.id);
        event?.remove();
        this.$message.success("Assignment deleted");
      }

      // Hide detail window
      this.showAssignmentDetail = false;
      this.selectedEvent = null;
      this.lastSelectedEventId = null;
    },
    handleCancel() {
      // Reset changes on event edited
      if (this.assignmentForm.id) {
        const calendarApi = this.calendarApi;
        const existingEvent = calendarApi.getEventById(this.assignmentForm.id);
        const { id, start, end } = this.lastEditOriginalData;

        if (existingEvent) {
          existingEvent.setStart(start);
          existingEvent.setEnd(end);
          existingEvent.setProp('startEditable', false);
          existingEvent.setProp('durationEditable', false);
        }

        this.lastEditOriginalData = null;
      }

      this.resetAssignmentFormWithEmptyData();
      this.isEditing = false;

      if (this.selectedEvent){
        this.showAssignmentDetail = true;
      }

      this.showAssignmentForm = false;
      this.isAssignmentRecurring = false;
      console.log('assignment recurring false now')
    },
    handleTeamCellClick(row, column) {
      if (this.visibleTeams.has(row.id)) {
        this.visibleTeams.delete(row.id);
      } else {
        this.visibleTeams.add(row.id);
      }

      // const filteredEvents = this.calendarEvents.filter(event =>
      //     this.visibleTeams.has(event.extendedProps.teamId)
      // );
      //
      // const calendarApi = this.calendarApi;
      // calendarApi.removeAllEvents();
      // filteredEvents.forEach(event => calendarApi.addEvent(event));

      this.calendarOptions.events = this.calendarEvents.filter(event => this.visibleTeams.has(event.extendedProps.teamId));
    },
    handleRecurrenceCheckboxChange(val) {
      if (val) {
        this.assignmentForm.daysOfWeek = [0, 1, 2, 3, 4, 5, 6];
        this.assignmentForm.start = null;
        this.assignmentForm.end = null;
      }
    },
    handleEventDrop(info) {
      const event = info.event;
      this.assignmentForm.start = event.start;
      this.assignmentForm.end = event.end;
    },
    handleEventResize(info) {
      const event = info.event;
      this.assignmentForm.end = event.end;
    },
    handleFormChanged(formObjArray){
      this.assignmentForm.extendedProps.formTreeNodeIds = formObjArray.map(obj => obj.id);
      this.assignmentForm.extendedProps.formTreeNodeLabels = formObjArray.map(obj => obj.label);
    },
    translate,
    subTabTitle() {
      if (this.isEditing) {
        return 'Edit Assignment';
      }

      if (this.selectedEvent?.id) {
        return 'Assignment Detail';
      }

      return 'New Assignment';
    },
    searchOnVisibleTeamEvents() {
      const query = this.searchQuery.trim().toLowerCase();
      const calendarApi = this.calendarApi;

      if (!calendarApi) return;

      // Filter and re-add matching events
      this.calendarOptions.events = this.calendarEvents.filter(event => {
        const matchesTeam = this.visibleTeams.has(event.extendedProps.teamId);
        const matchesQuery = query ? event.title.toLowerCase().includes(query) : true;
        return matchesTeam && matchesQuery;
      });
    },
    getCalendarLocale(){
      const lang = getCurrentLanguage();

      // FullCalendar expects 'en' and 'zh-cn'
      if (lang.toLowerCase() === 'zh-cn') return 'zh-cn';
      return 'en'; // default fallback
    },
    validateAndSave(){
      this.$refs.assignmentFormRef.validate(valid => {
        if (valid) {
          this.handleSubmitClick();
        } else {
          this.$message.error('Please fill required fields before proceeding again.');
        }
      })
    },
    validateDaysOfWeek(rule, value, callback) {
      if (this.isAssignmentRecurring && (!value || value.length === 0)) {
        callback(new Error('Please select at least one day'));
      } else {
        callback();
      }
    },
    resetAssignmentFormWithEmptyData(){
      this.assignmentForm = {
        id: null,
        title: null,
        start: null,
        end: null,
        extendedProps: {
          formTreeNodeIds: [],
          formTreeNodeLabels: [],
          teamId: null,
        },
        groupId: null,
        daysOfWeek: null,
        startRecur: null,
        endRecur: null,
        startTime: null,
        endTime: null,
      };
    },
    mapDaysOfWeek(dayNumbers) {
      const dayMap = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      return dayNumbers.map(num => dayMap[num]).join(', ');
    },
    formatDate(date, format = 'yyyy-MM-dd') {
      if (!date) return '';

      const d = new Date(date);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const hour = String(d.getHours()).padStart(2, '0');
      const minute = String(d.getMinutes()).padStart(2, '0');

      switch (format) {
        case 'yyyy-MM-dd HH:mm':
          return `${year}-${month}-${day} ${hour}:${minute}`;
        case 'HH:mm':
          return `${hour}:${minute}`;
        case 'yyyy-MM-dd':
        default:
          return `${year}-${month}-${day}`;
      }
    },
    createDisabledEndDate(startFieldName) {
      return (date) => {
        const startDate = this.assignmentForm[startFieldName];
        if (!startDate) return false;

        const selectedDate = new Date(date).getTime();
        const startDateTime = new Date(startDate).getTime();

        return selectedDate < startDateTime;
      };
    },
    async fetchTeamOptions() {
      try {
        const response = await getAllTeams();
        if (response.data.status === "200") {
          // Adding value, label field to be used as dropdown additionally
          this.teamsOptions = response.data.data.map(team => ({
            ...team,
            value: team.leader?.name || "-",
            label: team.name,
          }));

          // Initialize event visibility to show all teams events
          this.visibleTeams = new Set(this.teamsOptions.map(team => team.id));
        } else {
          this.teamsOptions = [];
          this.visibleTeams = new Set();
        }
      } catch (error) {
        this.$message.error("Error fetching teams data.");
        this.teamsOptions = [];
        this.visibleTeams = new Set();
      }
    },
    async fetchAllCalendarAssignment() {
      try {
        this.isLoadingCalendar = true;
        const res = await getAllCalendarAssignments();

        if (res.data.status !== "200") {
          throw new Error("Fetch failed");
        }

        this.calendarAssignments = res.data.data;
        this.calendarEvents = this.calendarAssignments.map(this.transformAssignmentToFCFormat);
        this.calendarOptions.events = this.calendarEvents;

        // this.$notify({
        //   title: translate("orderManagement.messages.messageTitle"),
        //   message: 'Calendar Refreshed',
        //   type: "success",
        // });
      } catch (err) {
        this.$message.error("Error fetching calendar data.");
        this.calendarAssignments = [];
        this.calendarEvents = [];
        this.calendarOptions.events = [];
      } finally {
        this.isLoadingCalendar = false;
      }
    },
    transformAssignmentToFCFormat(assignment) {
      const {
        id, name, startDate, endDate, groupId, allDay,
        startDateRecur, endDateRecur, startTime, endTime,
        daysOfWeek, teamId,
        ...customProps
      } = assignment;

      const teamColor = this.getColorByTeamId(teamId);

      // Build event format used by FullCalendar
      const eventObject = {
        id,
        title: name,
        start: startDate,
        end: endDate,
        groupId,
        allDay,
        daysOfWeek,
        startRecur: startDateRecur,
        endRecur: endDateRecur,
        startTime,
        endTime,
        startEditable: false,
        durationEditable: false,
        backgroundColor: teamColor,
        borderColor: teamColor,
        extendedProps: {
          teamId,
          formTreeNodeLabels: [],
          ...customProps
        }
      };

      // Remove fields with null/undefined/"undefined" values
      return this.sanitizeObject(eventObject);
    },
    sanitizeObject(obj) {
      return Object.fromEntries(
          Object.entries(obj).filter(
              ([_, value]) =>
                  value !== null &&
                  value !== undefined &&
                  value !== "undefined"
          )
      );
    },
    getTeamNameById(teamId){
      const team = this.teamsOptions.find(team => team.id === teamId);
      return team ? team.label : 'unknown team'
    },
    getColorByTeamId(teamId){
      const index = this.teamsOptions.findIndex(t => t.id === teamId);

      if (index === -1) return '#cccccc'; // fallback color
      return this.colors[index % this.colors.length];
    },
    async loadCalender() {
      await this.fetchTeamOptions();
      await this.fetchAllCalendarAssignment();
    },
    async loadFormNodes() {
      try {
        const response = await fetchFormNodes();
        const updatedFormMap = generateFormMap(response.data);

        if (JSON.stringify(this.formMap) !== JSON.stringify(updatedFormMap)) {
          this.formMap = updatedFormMap;
        }
      } catch (error) {
        this.$message.error(translate('orderManagement.messages.errorLoadingFormTree'));
      }
    },
    getRowClass({ rowIndex }) {
      return rowIndex === 0 ? 'tour-first-team-row' : '';
    },
    formatTimeToIsoString(time) {
      if (!time) return null;
      const date = new Date(time);
      return date.toISOString().substring(11, 19) + 'Z';
    },
    async fetchTeamDetails(teamId) {
      if (this.teamDetails[teamId]) return;

      try {
        const response = await getUsersForTeam(teamId);
        if (response?.data?.status === '200') {
          const teamData = this.teamsOptions.find(t => t.id === teamId) || null;

          this.teamDetails[teamId] = {
            id: teamId,
            leader: teamData.leader?.name || null,
            type: teamData.type || null, // Replace if you have team type elsewhere
            description: teamData.description || null, // Replace if available
            members: response.data.data || null,
          };
        }
      } catch (e) {
        console.error(`Failed to fetch team ${teamId} details`, e);
      }
    },
    durationToDate(durationObj){
      if (!durationObj || typeof durationObj.milliseconds !== 'number') return null;

      const ms = durationObj.milliseconds;
      const date = new Date(); // Use today’s date
      date.setHours(0, 0, 0, 0); // Reset to midnight
      return new Date(date.getTime() + ms);
    },
    revertLastSelectedEvent(currentEventId = null) {
      // if (!this.lastSelectedEventId) return;
      //
      // // Avoid reverting the current event (used in eventClick)
      // if (currentEventId && this.lastSelectedEventId === currentEventId) return;
      //
      // const calendarApi = this.calendarApi;
      // const lastEvent = calendarApi.getEventById(this.lastSelectedEventId);
      // if (!lastEvent) return;
      //
      // const teamId = lastEvent.extendedProps?.teamId;
      // const color = this.getColorByTeamId(teamId);
      //
      // lastEvent.setProp('backgroundColor', color);
      // lastEvent.setProp('borderColor', color);
      // lastEvent.setProp('startEditable', false);
      // lastEvent.setProp('durationEditable', false);
      //
      // // Only reset if this is not called during an event click on the same event
      // if (!currentEventId) {
      //   this.lastSelectedEventId = null;
      // }

      if (!this.lastSelectedEventId) return;

      // Avoid reverting if re-clicking the same event
      if (currentEventId && this.lastSelectedEventId === currentEventId) return;

      const calendarApi = this.calendarApi;
      const allEvents = calendarApi.getEvents();

      // Get current last event
      const baseEvent = allEvents.find(e => e.id === this.lastSelectedEventId);
      if (!baseEvent) return;

      const groupId = baseEvent.groupId;
      const teamId = baseEvent.extendedProps?.teamId;
      const color = this.getColorByTeamId(teamId);

      // Revert either all with matching groupId (recurring) or just the one
      const eventsToReset = groupId
          ? allEvents.filter(e => e.groupId === groupId)
          : [baseEvent];

      eventsToReset.forEach(event => {
        event.setProp('backgroundColor', color);
        event.setProp('borderColor', color);
        event.setProp('startEditable', false);
        event.setProp('durationEditable', false);
      });

      // Reset state unless this was called from the same event
      if (!currentEventId) {
        this.lastSelectedEventId = null;
      }


    }
  },
  mounted() {
    this.loadCalender();
    this.loadFormNodes()
  }
}
</script>

<style>

.selected-event {
  background-color: #bce8f1 !important;
  border-color: #bce8f1 !important;
  text-color: black;
}

.aside-panel-left {
  border: 1px solid #dcdfe6;       /* light gray border */
  border-radius: 12px;             /* rounded corners */
  padding: 10px;                   /* internal spacing */
  background-color: #fff;          /* optional: clean background */
  width: 200px;
  max-height: 96vh;
}

.aside-panel-right {
  border: 1px solid #dcdfe6;       /* light gray border */
  border-radius: 12px;             /* rounded corners */
  padding: 10px;                   /* internal spacing */
  background-color: #fff;          /* optional: clean background */
  width: 350px;
  max-height: 96vh;
}

.clickable-table .el-table__body td {
  cursor: pointer;
}

.refresh-button {
  background-color: #80cfff; /* Slightly lighter shade of primary color */
  border-color: #80cfff; /* Match lighter background */
  margin: 0px;
}

.refresh-button:hover {
  background-color: #66b5ff; /* Slightly darker hover effect */
  border-color: #66b5ff;
  transform: rotate(360deg); /* Rotate on hover */
  transition: transform 0.3s ease-in-out, background-color 0.2s ease; /* Smooth animation */
}

.refresh-button el-icon {
  color: #004085; /* Darker primary-like color for the refresh icon */
}

</style>
