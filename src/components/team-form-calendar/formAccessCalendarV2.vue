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

        <el-form-item prop="teamId" :label="'Team'" required>
          <el-select
              v-model="assignmentForm.teamId"
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

        <el-form-item v-if="!isAssignmentRecurring" prop="startDate" :label="'Start Date'" required>
          <el-date-picker
              v-model="assignmentForm.startDate"
              :type="assignmentForm.allDay ? 'date' : 'datetime'"
              placeholder="Select start date"
          />
        </el-form-item>

        <el-form-item v-if="!isAssignmentRecurring" prop="endDate" :label="'End Date'" required>
          <el-date-picker
              v-model="assignmentForm.endDate"
              :type="assignmentForm.allDay ? 'date' : 'datetime'"
              placeholder="Select end date"
              :disabled-date="createDisabledEndDate('startDate')"
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

        <el-form-item prop="selectedFormIds" :label="'Accessible Form'" required label-position="top">
          <TeamFormTree
              :show-only-selected-node="false"
              :selected-form-ids="assignmentForm.selectedFormIds"
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
                <div v-if="teamDetails[selectedEvent.teamId]">
                  <p><b>ID:</b> {{ teamDetails[selectedEvent.teamId].id }}</p>
                  <p><b>Type:</b> {{ teamDetails[selectedEvent.teamId].type || 'N/A' }}</p>
                  <p><b>Leader:</b> {{ teamDetails[selectedEvent.teamId].leader || 'N/A' }}</p>
                  <p><b>Description:</b> {{ teamDetails[selectedEvent.teamId].description || 'N/A' }}</p>
                  <p><b>Members:</b></p>
                  <ul style="padding-left: 20px;">
                    <li v-for="member in teamDetails[selectedEvent.teamId].members" :key="member.id">
                      {{ member.name }} ({{ member.role.name }})
                    </li>
                  </ul>
                </div>
                <div v-else>Loading...</div>
              </template>
              <template #reference>
                {{ getTeamNameById(selectedEvent.teamId) }}
              </template>
            </el-popover>
          </el-tag>
        </el-descriptions-item>

        <el-descriptions-item v-if="selectedEvent.startDate" label="Start Date">
          {{ selectedEvent.startDate || '-' }}
        </el-descriptions-item>
        <el-descriptions-item v-if="selectedEvent.endDate" label="End Date">
          {{ selectedEvent.endDate || '-' }}
        </el-descriptions-item>

        <el-descriptions-item v-if="selectedEvent.groupId" label="Group ID">
          {{ selectedEvent?.groupId }}
        </el-descriptions-item>

        <el-descriptions-item label="Recurrence Start Date" v-if="isAssignmentRecurring">
          {{ selectedEvent.startDateRecur ? formatDateToYMD(selectedEvent.startDateRecur) : 'Unlimited' }}
        </el-descriptions-item>

        <el-descriptions-item label="Recurrence End Date" v-if="isAssignmentRecurring">
          {{ selectedEvent.endDateRecur ? formatDateToYMD(selectedEvent.endDateRecur) : 'Unlimited' }}
        </el-descriptions-item>

        <el-descriptions-item label="Repeated On" v-if="isAssignmentRecurring">
          {{
            selectedEvent.daysOfWeek?.length
                ? mapDaysOfWeek(selectedEvent.daysOfWeek)
                : '-'
          }}
        </el-descriptions-item>

        <el-descriptions-item label="Daily Start Time" v-if="isAssignmentRecurring && !selectedEvent.allDay">
          {{ selectedEvent.startTime ? selectedEvent.startTime : '-' }}
        </el-descriptions-item>

        <el-descriptions-item label="Daily End Time" v-if="isAssignmentRecurring && !selectedEvent.allDay">
          {{ selectedEvent.endTime ? selectedEvent.endTime : '-' }}
        </el-descriptions-item>

        <el-descriptions-item label="Accessible Forms" :span="2">
          <TeamFormTree
              :show-only-selected-node="true"
              :selected-form-ids="selectedEvent.selectedFormIds"
              :expand-all-nodes="true"
              @update-selected-forms="handleFormChanged"
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
        title: '',
        startDate: '',
        endDate: '',
        selectedFormIds: [],
        selectedFormLabels: [],
        teamId: null,
        groupId: null,
        daysOfWeek: null,
        startRecur: null,
        endRecur: null,
        startTime: null,
        endTime: null,
      },
      formRules: {
        title: [{ required: true, message: 'Please enter a name', trigger: 'blur' }],
        teamId: [{ required: true, message: 'Please select a team', trigger: 'change' }],
        startDate: [
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
        endDate: [
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
        selectedFormIds: [{ type: 'array', required: true, message: 'Please select at least one form', trigger: 'change' }],
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
      visibleTeams: new Set([1, 2]),
      teams: [
        {
          id: 1,
          name: '大川组',
          color: '#f94144',
          events:[
            {
              id: 1,
              title: 'Form set C',
              date: '2025-04-21',
              start: '2025-04-21',
              end: '2025-04-24',
              allDays: true,
              extendedProps: {
                selectedFormIds: ['f308781d-efe5-4224-8bc9-5b8b4314e798', '37452b87-c08e-47f3-a659-677efacdf328'],
                selectedFormLabels: ['感官检测表单', '来料检测表单'],
                teamId: 1,
              },
              startEditable: false,
              durationEditable: false,
            },
          ]
        },
        {
          id: 2,
          name: '中川组',
          color: '#90be6d',
          events:[
            {
              id: 3,
              title: 'Form set B',
              date: '2025-04-07',
              allDays: true,
              extendedProps: {
                selectedFormIds: ['f308781d-efe5-4224-8bc9-5b8b4314e798'],
                selectedFormLabels: ['感官检测表单'],
                teamId: 2,
              },
              daysOfWeek:[2,4],
              startEditable: false,
              durationEditable: false,
              groupId: 3,
            }
          ]
        },
        {
          id: 3,
          name: '小川组',
          color: '#f8961e',
          events:[
          ]
        },
      ],
      calendarAssignments: [],
      calendarEvents: [],
      colors: [
        '#f94144',
        '#f8961e',
        '#f8db1e',
        '#90be6d',
        '#00ff48',
        '#00ffbb',
        '#00eaff',
        '#0080ff',
        '#8c00ff',
        '#dd00ff',
        '#ff00c3',
      ]
    }
  },
  methods: {
    handleDateClick(arg) {
      // TODO: temporarily use cancel to revert changes in case edit is not confirm
      this.handleCancel();

      const calendarApi = this.calendarApi;

      // Revert highlighting on last selected event
      if (this.lastSelectedEventId) {
        const lastSelectedEvent = calendarApi.getEventById(this.lastSelectedEventId);
        const color = this.getColorByTeamId(lastSelectedEvent.extendedProps?.teamId);
        lastSelectedEvent.setProp('backgroundColor',color);
        lastSelectedEvent.setProp('borderColor', color);
        lastSelectedEvent.setProp('startEditable', false);
        lastSelectedEvent.setProp('durationEditable', false);
        this.lastSelectedEventId = null;
      }

      // Adjust selection and hides assignment detail
      this.selectedEvent = null;
      this.showAssignmentDetail = false;

      // Prefill for date and isAllDay
      this.resetAssignmentFormWithEmptyData();
      this.assignmentForm.startDate = arg.date;
      this.assignmentForm.allDay = arg.allDay

      this.isAssignmentRecurring = false;
      this.showAssignmentForm = true;
    },
    async handleEventClick(info) {
      // TODO: temporarily use cancel to revert changes in case edit is not confirm
      this.handleCancel();

      const calendarApi = this.calendarApi;

      // Remove highlight on last selected event
      if (this.lastSelectedEventId && (this.lastSelectedEventId !== info.event.id)) {
        const lastSelectedEvent = calendarApi.getEventById(this.lastSelectedEventId);
        const color = this.getColorByTeamId(lastSelectedEvent.extendedProps.teamId);
        lastSelectedEvent.setProp('backgroundColor', color);
        lastSelectedEvent.setProp('borderColor', color);
        lastSelectedEvent.setProp('startEditable', false);
        lastSelectedEvent.setProp('durationEditable', false);
      }

      // Highlight currently selected event
      const event = calendarApi.getEventById(info.event.id);
      event.setProp('backgroundColor', '#bce8f14d');
      event.setProp('borderColor', '#bce8f1');
      this.lastSelectedEventId = info.event.id;

      // Setup data to display
      this.selectedEvent = this.calendarAssignments.find(assignment => assignment.id == info.event.id);
      this.selectedEvent.selectedFormIds = this.selectedEvent.formTreeNodeIds || [];
      this.selectedEvent.selectedFormLabels = this.selectedEvent.selectedFormIds.map(id => this.formMap[id] || "(unknown label)");
      this.isAssignmentRecurring = !!this.selectedEvent.daysOfWeek;
      await this.fetchTeamDetails(this.selectedEvent.teamId);

      // Show detail window
      this.showAssignmentDetail = true;
      this.showAssignmentForm = false;
    },
    handleEditClick() {
      console.log('edit clicked');
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
      }

      // Prepare form with selected event
      this.assignmentForm = {
        ...this.selectedEvent
      };

      console.log("prefilled assignment form:");
      console.log(this.assignmentForm);

      // Show form window
      this.showAssignmentDetail = false;
      this.isEditing = true;
      this.showAssignmentForm = true;
    },
    async handleSubmitClick() {
      // Destruct assignment form data
      const {
        id,
        groupId,
        title,
        startDate,
        endDate,
        teamId,
        selectedFormIds,
        selectedFormLabels,
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
            startDate,
            endDate,
            allDay,
            ...recurrenceData,
            formTreeNodeIds: selectedFormIds,
            teamId,
          }).filter(([_, value]) => value !== null && value !== undefined && value !== "undefined" && value !== ""));

      console.log("submitted event payload:")
      console.log(eventPayload);

      const currentUserId = this.$store.getters.getUser.id;
      if (this.isEditing) {
        eventPayload.updated_by = currentUserId;
        const response = await updateCalendarAssignment(id, eventPayload);
        if (response.data.status === 200) {
          this.$message.success("Successfully updated calendar assignment");
        }
      } else {
        eventPayload.created_by = currentUserId;
        const response = await createCalendarAssignment(eventPayload);
        if (response.data.status === 200) {
          this.$message.success("Successfully created calendar assignment");
        }
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
      if (this.isEditing) {
        // Update detail window data
        this.selectedEvent = this.calendarAssignments.find(assignment => assignment.id === id);
        this.selectedEvent.selectedFormIds = this.selectedEvent.formTreeNodeIds || [];
        this.selectedEvent.selectedFormLabels = this.selectedEvent.selectedFormIds.map(id => this.formMap[id] || "(unknown label)");
        this.isAssignmentRecurring = !!this.selectedEvent.daysOfWeek;
        await this.fetchTeamDetails(this.selectedEvent.teamId);

        this.isEditing = false;
        this.showAssignmentDetail = true;
      }

      this.resetAssignmentFormWithEmptyData();
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
    },
    handleTeamCellClick(row, column) {
      if (this.visibleTeams.has(row.id)) {
        this.visibleTeams.delete(row.id);
      } else {
        this.visibleTeams.add(row.id);
      }

      this.calendarOptions.events = this.calendarEvents.filter(event => this.visibleTeams.has(event.extendedProps.teamId));
    },
    handleRecurrenceCheckboxChange(val) {
      if (val) {
        this.assignmentForm.daysOfWeek = [0, 1, 2, 3, 4, 5, 6];
        this.assignmentForm.startDate = null;
        this.assignmentForm.endDate = null;
      }
    },
    handleEventDrop(info) {
      const event = info.event;
      this.assignmentForm.startDate = event.start;
      this.assignmentForm.endDate = event.end;
    },
    handleEventResize(info) {
      const event = info.event;
      this.assignmentForm.endDate = event.end;
    },
    handleEventMouseEnter(info) {},
    handleEventMouseLeave(info) {},
    handleFormChanged(formObjArray){
      this.assignmentForm.selectedFormIds = formObjArray.map(obj => obj.id);
      this.assignmentForm.selectedFormLabels = formObjArray.map(obj => obj.label);
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
    getFormById(formId) {
      return this.formMap[formId] || translate('orderManagement.orderFormDialog.unknownForm');
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
        title: '',
        startDate: '',
        endDate: '',
        selectedFormIds: [],
        selectedFormLabels: [],
        teamId: null,
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
    formatDateToYMD(date) {
      if (!date) return '';
      const d = new Date(date);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
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
        const response = await getAllCalendarAssignments();
        if (response.data.status === "200") {
          this.calendarAssignments = response.data.data.map(a => ({
          ...a, title: a.name,
          }));
          this.calendarEvents = this.calendarAssignments.map(this.transformAssignmentToFCFormat);
          this.calendarOptions.events = this.calendarEvents;
        } else {
          this.calendarAssignments = [];
          this.calendarEvents = [];
          this.calendarOptions.events = [];
        }
      } catch (error) {
        this.$message.error("Error fetching calendar data.");
        this.calendarAssignments = [];
        this.calendarEvents = [];
        this.calendarOptions.events = [];
      }
    },
    transformAssignmentToFCFormat(assignment) {
      const {
        id, title, startDate, endDate, groupId, allDay,
        startDateRecur, endDateRecur, startTime, endTime,
        daysOfWeek, teamId,
        ...customProps
      } = assignment;

      const teamColor = this.getColorByTeamId(teamId);

      // Build the base event object
      const eventObject = {
        id,
        title,
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
  width: 300px;
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
